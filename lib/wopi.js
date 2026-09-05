var wopi = {discovery_url: null, mimes: {}, extensions: {}};

wopi.init = async function (discovery_url) {
	try {
		var d = await reqXML('GET', discovery_url);
	}
	catch (e) {
		// FIXME: notify
		return;
	}

	d.querySelectorAll('app').forEach(app => {
		var mime = (a = app.getAttribute('name').match(/^.*\/.*$/)) ? a[0] : null;
		wopi.mimes[mime] = {};

		app.querySelectorAll('action').forEach(action => {
			var ext = action.getAttribute('ext').toUpperCase();
			var url = action.getAttribute('urlsrc').replace(/<[^>]*&>/g, '');
			var name = action.getAttribute('name');

			if (mime) {
				wopi.mimes[mime][name] = url;
			}
			else {
				if (!wopi.extensions.hasOwnProperty(ext)) {
					wopi.extensions[ext] = {};
				}

				wopi.extensions[ext][name] = url;
			}
		});
	});
};

wopi.getEditURL = (name, mime) => {
	var file_ext = name.replace(/^.*\.(\w+)$/, '$1').toUpperCase();

	if (wopi.mimes.hasOwnProperty(mime) && wopi.mimes[mime].hasOwnProperty('edit')) {
		return wopi.mimes[mime].edit;
	}
	else if (wopi.extensions.hasOwnProperty(file_ext) && wopi.extensions[file_ext].hasOwnProperty('edit')) {
		return wopi.extensions[file_ext].edit;
	}

	return null;
};

wopi.getViewURL = (name, mime) => {
	var file_ext = name.replace(/^.*\.(\w+)$/, '$1').toUpperCase();

	if (wopi.mimes.hasOwnProperty(mime) && wopi.mimes[mime].hasOwnProperty('view')) {
		return wopi.mimes[mime].view;
	}
	else if (wopi.extensions.hasOwnProperty(file_ext) && wopi.extensions[file_ext].hasOwnProperty('view')) {
		return wopi.extensions[file_ext].view;
	}

	return wopi.getEditURL(name, mime);
};

wopi.open = async (document_url, wopi_url) => {
	var properties = await reqXML('PROPFIND', document_url, wopi_propfind_tpl, {'Depth': '0'});
	var src = (a = properties.querySelector('wopi-url')) ? a.textContent : null;
	var token = (a = properties.querySelector('token')) ? a.textContent : null;
	var token_ttl = (a = properties.querySelector('token-ttl')) ? a.textContent : +(new Date(Date.now() + 3600 * 1000));

	if (!src || !token) {
		alert('Cannot open document: WebDAV server did not return WOPI properties');
	}

	wopi_url += '&WOPISrc=' + encodeURIComponent(src);

	browser.openDialog(wopi_dialog, false);
	$('dialog').className = 'preview';

	var f = $('dialog form');
	f.target = 'wopi_frame';
	f.action = wopi_url;
	f.method = 'post';
	f.insertAdjacentHTML('beforeend', `<input name="access_token" value="${token}" type="hidden" /><input name="access_token_ttl" value="${token_ttl}" type="hidden" />`);
	f.submit();
};
