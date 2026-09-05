var dav = {headers: {}, current_xhr: null};

dav.setAuth = function (username, password) {
	dav.headers = {};

	if (username && password) {
		dav.headers['Authorization'] = 'Basic ' + btoa(user + ':' + password);
	}
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
	const body = '<'+ `?xml version="1.0" encoding="UTF-8"?>
		<D:propfind xmlns:D="DAV:" xmlns:oc="http://owncloud.org/ns">
			<D:prop>
				<D:getlastmodified/><D:getcontenttype/><D:getcontentlength/><D:resourcetype/><D:displayname/><oc:permissions/>
			</D:prop>
		</D:propfind>`;

	parent_url = normalizeURL(parent_url);
	var xml = await dav.propfind(parent_url, body, 1);
	var files = {};

	var list = xml.querySelectorAll('response');

	for (var i = 0; i < list.length; i++) {
		var node = list[i];
		var path = node.querySelector('href').textContent;
		var url = normalizeURL(path);
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

		// Assume we can do anything if no permissions are supplied
		var permissions = 'WCKDNVG';

		if (prop = node.querySelector('permissions')) {
			permissions = prop.textContent;
		}

		permissions = permissions.split('');

		var modified = null;

		if (prop = node.querySelector('getlastmodified')) {
			modified = new Date(prop.textContent);
		}

		var mime = null;

		if (!is_dir && (prop = node.querySelector('getcontenttype'))) {
			mime = prop.textContent;
		}

		var size = null;

		if ((prop = node.querySelector('getcontentlength')) && prop.textContent !== '') {
			size = parseInt(prop.textContent, 10);
		}

		var path = url.substring(base_url.length);

		var extension = null;

		if (!is_dir && (m = url.match(/\.([^./]{1,4})$/))) {
			extension = m[1].toLowerCase();
		}

		files[url === parent_url ? '.' : name] = {url, path, name, size, mime, modified, is_dir, permissions, extension};
	}

	return files;
};

dav.copymove = function(method, src, dst, overwrite) {
	dst = normalizeURL(dst);
	overwrite = overwrite === true ? 'T' : 'F';
	return dav.send(method, src, '', {'Destination': dst, 'Overwrite': overwrite});
};

dav.exists = async function (url) {
	var r = await dav.send('HEAD', url);
	return r.status === 200;
};
