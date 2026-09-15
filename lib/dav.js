var dav = {
	auth: false,
	headers: {},
	current_xhr: null
};

dav.setAuth = function (username, password) {
	if (!username && !password) {
		return;
	}

	dav.auth = true;
	dav.headers['Authorization'] = 'Basic ' + btoa(user + ':' + password);
};

dav.send = function (method, url, body, headers) {
	headers = Object.assign(headers || {}, dav.headers);
	return fetch(url, {method, body, headers});
};

dav.xhr = function (method, url, progress_callback) {
	var xhr = new XMLHttpRequest();
	dav.current_xhr = xhr;
	xhr.responseType = 'blob';
	var p = new Promise((resolve, reject) => {
		xhr.open(method, url);
		xhr.onload = function () {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.response);
			} else {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			}
		};
		xhr.onerror = function () {
			reject({
				status: this.status,
				statusText: xhr.statusText
			});
		};
		xhr.onprogress = progress_callback;
		xhr.send();
	});
	return p;
};

dav.propfind = async function (url, body, depth) {
	var r = await dav.send('PROPFIND', url, body, {'Depth': depth, 'Content-Type': 'text/xml; charset=utf-8'});
	r = await r.text();
	return new window.DOMParser().parseFromString(r, "text/xml");
};

dav.list = async function (parent_url) {
	if (parent_url.substr(-1) !== '/') {
		parent_url += '/';
	}

	const getString = (node, name) => ((prop = node.querySelector(name)) && prop.textContent !== '') ? prop.textContent : null;
	const getInt = (node, name) => (v = getString(node, name)) ? parseInt(v, 10) : null;
	const getBool = (node, name) => (v = getString(node, name)) ? v === 'true' ? true : false : null;

	// see https://docs.nextcloud.com/server/stable/developer_manual/client_apis/WebDAV/basic.html#requesting-properties
	const body = '<'+ `?xml version="1.0" encoding="UTF-8"?>
		<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
			<d:prop>
				<d:getlastmodified />
				<d:getcontenttype />
				<d:getcontentlength />
				<d:resourcetype />
				<d:displayname />
				<d:getetag />
				<d:quota-available-bytes />
				<d:quota-used-bytes />
				<oc:permissions />
				<nc:has-preview />
			</d:prop>
		</d:propfind>`;

	parent_url = utils.normalizeURL(parent_url);
	var xml = await dav.propfind(parent_url, body, 1);
	var files = {};

	var list = xml.querySelectorAll('response');

	for (var i = 0; i < list.length; i++) {
		var node = list[i];
		var path = node.querySelector('href').textContent;
		var url = utils.normalizeURL(path);
		var props = null;

		node.querySelectorAll('propstat').forEach(propstat => {
			if (propstat.querySelector('status').textContent.match(/200/)) {
				props = propstat;
			}
		});

		// This item didn't return any properties, everything is 404?
		if (!props) {
			console.error('Cannot find properties for: ' + url);
			return;
		}

		var name = url.replace(/\/$/, '').split('/').pop();
		name = decodeURIComponent(name);
		var is_dir = node.querySelector('resourcetype collection') ? true : false;

		var permissions = getString(node, 'permissions');
		// Assume we can do anything if no permissions are supplied
		// (except NextCloud features like sharing)
		permissions = permissions ?? 'WCKDNVG';
		permissions = permissions.split('');

		var path = url.substring(browser.webdav_url.length);

		var extension = null;

		if (!is_dir && (m = url.match(/\.([^./]{1,4})$/))) {
			extension = m[1].toLowerCase();
		}

		var properties = {
			url,
			path,
			name,
			size: getString(node, 'getcontentlength'),
			mime: !is_dir ? getString(node, 'getcontenttype') : null,
			etag: getString(node, 'getetag'),
			modified: (v = getString(node, 'getlastmodified')) ? new Date(v) : null,
			is_dir,
			permissions,
			extension,
			has_thumbnail: getBool(node, 'has-preview') ?? false,
		};

		// Only add these properties when they're available (less memory used for listings)
		if (null !== (used_quota = getInt(node, 'quota-used-bytes'))) {
			properties.used_quota = used_quota;
			properties.available_quota = getInt(node, 'quota-available-bytes');
		}

		files[url === parent_url ? '.' : name] = properties;
	}

	return files;
};

dav.copymove = function(method, src, dst, overwrite) {
	dst = utils.normalizeURL(dst);
	overwrite = overwrite === true ? 'T' : 'F';
	return dav.send(method, src, '', {'Destination': dst, 'Overwrite': overwrite});
};

dav.exists = async function (url) {
	var r = await dav.send('HEAD', url);
	return r.status === 200;
};
