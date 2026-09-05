var css_url = document.currentScript.src.replace(/\/[^\/]+$/, '') + '/webdav.css?2025';

const WebDAVNavigator = async function (url, options) {
	const PREVIEW_TYPES = /^image\/(png|webp|svg|jpeg|jpg|gif|png)|^application\/pdf|^text\/|^audio\/|^video\/|application\/x-empty/;
	const PREVIEW_EXTENSIONS = /\.(?:png|webp|svg|jpeg|jpg|gif|png|pdf|txt|css|js|html?|md|mp4|mkv|webm|ogg|flac|mp3|aac|m4a|avi)$/i;

	const OPENDOCUMENT_TEMPLATES = {
		'ods': 'UEsDBBQAAAAAAOw6wVCFbDmKLgAAAC4AAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0UEsDBBQAAAAIABxZFFFL43PrmgAAAEABAAAVAAAATUVUQS1JTkYvbWFuaWZlc3QueG1slVDRDoMgDHz3KwjvwvZK1H9poEYSKETqon8vLpluWfawPrXXy921XQTyIxY2r0asMVA5x14uM5kExRdDELEYtiZlJJfsEpHYfPLNXd2kGBpRqzvB0QdsK3nexIUtIbQZeOqllhcc0XloecvYS8g5eAvsE+kHOfWMod7dVckzgisTIkv9p61NxIdGveBHAMaV9bGu0p3++tXQ7FBLAwQUAAAACAAAWRRRA4GGVIkAAAD/AAAACwAAAGNvbnRlbnQueG1sXY/RCsIwDEWf9SvG3uv0Ncz9S01TLLTNWFJwf29xbljzEu49N1wysvcBCRxjSZTVIGetu3ulmAU2eu/LkoGtBIFsEwkoAs+U9yv4TcPtcu2nc1dn/DqCS5hVuqG1fe0y3iIZRxg/+LQzW5ST1YBGdI3Uwge7tcpDy7yQdfIk0i03NMFD/n85vQFQSwECFAMUAAAAAADsOsFQhWw5ii4AAAAuAAAACAAAAAAAAAAAAAAAtIEAAAAAbWltZXR5cGVQSwECFAMUAAAACAAcWRRRS+Nz65oAAABAAQAAFQAAAAAAAAAAAAAAtIFUAAAATUVUQS1JTkYvbWFuaWZlc3QueG1sUEsBAhQDFAAAAAgAAFkUUQOBhlSJAAAA/wAAAAsAAAAAAAAAAAAAALSBIQEAAGNvbnRlbnQueG1sUEsFBgAAAAADAAMAsgAAANMBAAAAAA==',
		'odp': 'UEsDBBQAAAAAAC6dVEszJqyoLwAAAC8AAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvblBLAwQUAAAACAAsYRRRP7fJFJoAAABBAQAAFQAAAE1FVEEtSU5GL21hbmlmZXN0LnhtbJVQwQqDMAy97ytK77bbNaj/EmpkhTYtNg79+1VhujF2WC5JXh7vJWkjsh+pCLwKtcTA5Wg7PU8MCYsvwBipgDhImXhIbo7EAp98uJmrVv1F1WgPcPSBmkqeVnVicwhNRrl32uoTjjR4bGTN1GnMOXiH4hPbBw9mX8O8u5s8Ual552j7p69LLJtIPeHHBkKL2G1cpVv79az+8gRQSwMEFAAAAAgAMl4UUXz4vRWJAAAA/gAAAAsAAABjb250ZW50LnhtbF2P0QqDMAxFn+dXiO+d22tw/ksXUyjYpJgI8+8tOGVdXsK994Qkg4QQkWASXBOxORS20ttPmlnhSF/dujCI16jAPpGCIUgmPqfgl4bn/dGNTVtq+DqKS8ymbT82t9MLZZELHslNhHOd+dUkeYvo1LaZ6vAt01bkpfNCWm4ouPAB9hV5yf8fx2YHUEsBAhQDFAAAAAAALp1USzMmrKgvAAAALwAAAAgAAAAAAAAAAAAAALSBAAAAAG1pbWV0eXBlUEsBAhQDFAAAAAgALGEUUT+3yRSaAAAAQQEAABUAAAAAAAAAAAAAALSBVQAAAE1FVEEtSU5GL21hbmlmZXN0LnhtbFBLAQIUAxQAAAAIADJeFFF8+L0ViQAAAP4AAAALAAAAAAAAAAAAAAC0gSIBAABjb250ZW50LnhtbFBLBQYAAAAAAwADALIAAADUAQAAAAA=',
		'odg': 'UEsDBBQAAAAAAE8+S1PfJa3pNAAAADQAAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmdyYXBoaWNzLXRlbXBsYXRlUEsDBBQAAAAIALZDh1ScUI71nQAAAEEBAAAVAAAATUVUQS1JTkYvbWFuaWZlc3QueG1slVDNDoIwDD7LU5Ddt+l1Ad+lGUWWbF3DioG3F0kEjfHgrf365ftpk4BCj0Xca6jnFKnsa6umkVyGEoojSFiceJcZqct+SkjiPvnuYs7qWp2aHehDRL0Sx6U+sClGzSBDq6w64IRdAC0LY6uAOQYPEjLZO3Vmi2Denc1tBB6CL1owcQRBVdt/rH0meeqsDX6EEJzFbudVuLFfz7pWD1BLAwQUAAAACADDQ4dUUZP77oMAAAD2AAAACwAAAGNvbnRlbnQueG1sXY9BCoNADEXX9RTifmq7Dda7TDOZMjCTiIlUb1/BVrSr8PJ+CL+TGBMSBMGpEJtDYVtnPZfMCpt9NNPIIF6TAvtCCoYgA/HvCo5puF9vTV9dui8qjmkwrdvDLq5fXPRILhDms/OTSfGW0Kktmc7yKWFZcecw+nfi15ZpT6Ed/7v11QdQSwECFAMUAAAAAABPPktT3yWt6TQAAAA0AAAACAAAAAAAAAAAAAAAtIEAAAAAbWltZXR5cGVQSwECFAMUAAAACAC2Q4dUnFCO9Z0AAABBAQAAFQAAAAAAAAAAAAAAtIFaAAAATUVUQS1JTkYvbWFuaWZlc3QueG1sUEsBAhQDFAAAAAgAw0OHVFGT++6DAAAA9gAAAAsAAAAAAAAAAAAAALSBKgEAAGNvbnRlbnQueG1sUEsFBgAAAAADAAMAsgAAANYBAAAAAA==',
		'odt': 'UEsDBBQAAAAAAPMbH0texjIMJwAAACcAAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHRQSwMEFAAAAAgA3U0SUeqX5meSAAAAMQEAABUAAABNRVRBLUlORi9tYW5pZmVzdC54bWyVUEEOgzAMu+8VqHfa7Rq1/CUqQavUphUNE/wemDTYNO2wW2I7thWbkMNAVeA1NHOKXI/VqWlkyFhDBcZEFcRDLsR99lMiFvjUw01fVXdp7AEMIVK7CcelObEpxrag3J0y6oQT9QFbWQo5haXE4FFCZvPgXj8r6PdkLTSLMv+E+cyyX26df8TunmanN19rvr7TrVBLAwQUAAAACACQThJRWmJBaH8AAADjAAAACwAAAGNvbnRlbnQueG1sXY/RCsMgDEXf+xWj767ba+j8FxcjCGpKE6H9+wlbRfYUbs69uWTlECISeMaaqahBLtrm7cipCHzpa657AXYSBYrLJKAIvFG5UjC64Xl/zHZaf0pwj5vKYq9FaA0mOCTjCdMAXFXOTiMa0TNRI/3Im/3ZfUqHttQysqnL/0/sB1BLAQIUAxQAAAAAAPMbH0texjIMJwAAACcAAAAIAAAAAAAAAAAAAACkgQAAAABtaW1ldHlwZVBLAQIUAxQAAAAIAN1NElHql+ZnkgAAADEBAAAVAAAAAAAAAAAAAACkgU0AAABNRVRBLUlORi9tYW5pZmVzdC54bWxQSwECFAMUAAAACACQThJRWmJBaH8AAADjAAAACwAAAAAAAAAAAAAApIESAQAAY29udGVudC54bWxQSwUGAAAAAAMAAwCyAAAAugEAAAAA'
	};

	// https://docs.nextcloud.com/server/latest/developer_manual//client_apis/WebDAV/basic.html
	// https://web.archive.org/web/20250829204116/https://doc.owncloud.com/desktop/next/appendices/architecture.html#server-side-permissions
	const PERM_SHARED = 'S'; // file or folder is shared
	const PERM_SHARE = 'R'; // can be shared (includes re-share)
	const PERM_MOUNTED = 'M'; // is mounted (like on Dropbox, Samba, etc.)
	const PERM_WRITE = 'W'; // can write to file
	const PERM_CREATE = 'C'; // can create file in folder
	const PERM_MKDIR = 'K'; // can create folder (mkdir)
	const PERM_DELETE = 'D';
	const PERM_RENAME = 'N';
	const PERM_MOVE = 'V';
	const PERM_READ = 'G';

	const _ = key => typeof lang_strings != 'undefined' && key in lang_strings ? lang_strings[key] : key;

	const mkdir_dialog = `<input type="text" name="mkdir" placeholder="${_('Directory name')}" />`;
	const mkfile_dialog = `<input type="text" name="mkfile" placeholder="${_('File name')}" />`;
	const rename_dialog = `<input type="text" name="rename" placeholder="${_('New file name')}" />`;
	const paste_upload_dialog = `<h3>Upload this file?</h3><input type="text" name="paste_name" placeholder="${_('New file name')}" />`;
	const edit_dialog = `<textarea name="edit" cols="70" rows="30"></textarea>`;
	const markdown_dialog = `<div id="mdp"><textarea name="edit" cols="70" rows="30"></textarea><div class="md_preview"></div></div>`;
	const delete_dialog = `<h3>${_('Confirm delete?')}</h3>`;
	const wopi_dialog = `<iframe id="wopi_frame" name="wopi_frame" allow="clipboard-read *; clipboard-write *;" allowfullscreen="true">
		</iframe>`;

	const dialog_tpl = `<dialog open><p class="close"><input type="button" value="&#x2716; ${_('Close')}" class="close" /></p><form><div>%s</div>%b</form></dialog>`;

	const html_tpl = `<!DOCTYPE html><html>
		<head><title></title><link rel="stylesheet" type="text/css" href="${css_url}" /></head>
		<body><main>
		<div class="toolbar">
			<div class="selection" style="display: none">
				<div class="buttons">
					<input type="button" class="icon download" value="${_('Download')}" />
					<input type="button" class="icon zip" value="${_('Download as ZIP')}" />
					<input type="button" class="icon delete" value="${_('Delete')}" />
					<input type="button" class="icon cut" value="${_('Cut')}" />
					<input type="button" class="icon copy" value="${_('Copy')}" />
				</div>
				<div class="paste">
					<input type="button" value="${_('Copy here')}" class="icon copy" />
					<input type="button" value="${_('Move here')}" class="icon move" />
				</div>
				<span class="count"></span>
				<input type="button" value="${_('Cancel')}" class="icon cancel" />
			</div>
			<div class="create">
				<input type="file" style="display: none;" multiple />
				<input class="icon upload" type="button" value="${_('Upload files')}" />
				<input class="icon mk" type="button" value="${_('New')}" />
				<div class="menu">
					<input class="icon mkdir" type="button" value="${_('Directory')}" />
					<input class="icon mktext" type="button" value="${_('Text file')}" />
					<div class="wopi">
						<h5>${_('Office document')}</h5>
						<input class="icon ODT" type="button" value="${_('Text')}" />
						<input class="icon ODS" type="button" value="${_('Spreadsheet')}" />
						<input class="icon ODP" type="button" value="${_('Presentation')}" />
						<input class="icon ODG" type="button" value="${_('Drawing')}" />
					</div>
				</div>
			</div>
		</div>
		<table style="display: none">
			<thead>
				<tr>
					<td scope="col" class="check"><input type="checkbox" /><label><span></span></label></td>
					<td scope="col" class="name" data-sort="name"><button>${_('Name')}</button></td>
					<td scope="col" class="size" data-sort="size"><button>${_('Size')}</button></td>
					<td scope="col" class="date" data-sort="date"><button>${_('Date')}</button></td>
					<td></td>
				</tr>
			</thead>
			<tbody></tbody>
		</table>
		</main><div class="bg"></div></body></html>`;

	const parent_row_tpl = `<tr class="parent">
		<td class="check"></td>
		<th colspan="2"><a href="../"><span class="icon parent"><b></b></span> ${_('Back')}</a></th>
		<td class="date"></td>
		<td class="buttons"></td>
	</tr>`;

	const file_row_tpl = `<tr data-name="%name%" class="%class%">
		<td class="check"><input type="checkbox" /><label><span></span></label></td>
		<th><a href="%url%">%thumb% %name%</a></th>
		<td class="size">%size_bytes%</td>
		<td class="date">%modified%</td>
		<td class="buttons">
		<div>
			<input class="icon edit" type="button" value="${_('Edit')}" title="${_('Edit')}" />
			<input class="icon download" type="button" value="${_('Download')}" title="${_('Download')}" />
			<input class="icon rename" type="button" value="${_('Rename')}" title="${_('Rename')}" />
			<input class="icon delete" type="button" value="${_('Delete')}" title="${_('Delete')}" />
		</div>
		</td>
	</tr>`;

	const icon_tpl = `<span class="icon %icon%"><b>%icon%</b></span>`;
	const root_url = url.replace(/(?<!\/)\/.*$/, '/');
	const image_thumb_tpl = `<img src="${root_url}index.php/apps/files/api/v1/thumbnail/150/150/%path%" alt="" />`;

	const wopi_propfind_tpl = '<' + `?xml version="1.0" encoding="UTF-8"?>
		<D:propfind xmlns:D="DAV:" xmlns:W="https://interoperability.blob.core.windows.net/files/MS-WOPI/">
			<D:prop>
				<W:wopi-url/><W:token/><W:token-ttl/>
			</D:prop>
		</D:propfind>`;

	// Global events ////
	window.addEventListener('beforeunload', () => {
		// Cancel any current download
		if (dav.current_xhr) {
			dav.current_xhr.abort();
		}

		return true;
	});

	// Util functions ///////

	const template = (tpl, params) => {
		return tpl.replace(/%(\w+)%/g, (a, b) => {
			return params[b];
		});
	};

	const html = (unsafe) => {
		return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	};

	const basename = path => path.split('/').pop();
	const dirname = path => {
		var parts = path.replace(/\/$/, '').split('/');
		parts.pop();
		return parts.join('/') + '/';
	};

	const $ = (a) => document.querySelector(a);

	const normalizeURL = (url) => {
		if (!url.match(/^https?:\/\//)) {
			url = base_url.replace(/^(https?:\/\/[^\/]+\/).*$/, '$1') + url.replace(/^\/+/, '');
		}

		return url;
	};

	const changeURL = (uri, push) => {
		try {
			if (push) {
				history.pushState(1, null, uri);
			}
			else {
				history.replaceState(1, null, uri);
			}

			if (popstate_evt) return;

			popstate_evt = window.addEventListener('popstate', (e) => {
				var url = location.pathname;
				browser.open(url, false);
			});
		}
		catch (e) {
			// If using a HTML page on another origin
			location.hash = uri;
		}
	};

	var js = {};
	js.root = document.currentScript.src.replace(/\/[^\/]+$/, '/');
	js.loaded = {};
	js.load = (url, css) => {
		if (url.substr(0, 2) === './') {
			url = js.root + url.substr(2);
		}

		return new Promise((resolve) => {
			if (url in js.loaded) {
				resolve(url);
				return;
			}

			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = url;
			script.onload = () => resolve(url)
			document.head.appendChild(script);

			if (css) {
				var l = document.createElement('link');
				l.type = 'text/css';
				l.rel = 'stylesheet';
				l.href = css;
				document.head.appendChild(l);
			}
		});
	};

	js.prism = (resolve) => js.load('./prism_editor.js', './prism_editor.css').then(url => {
		if (!(url in js.loaded)) {

		}

		resolve();
	});

	js.zipwriter = () => js.load('./zipwriter.js');

	const reqXML = (method, url, body, headers) => {
		return req(method, url, body, headers).then((r) => {
				if (!r.ok) {
					throw new Error(r.status + ' ' + r.statusText);
				}
				return r.text();
			}).then(str => new window.DOMParser().parseFromString(str, "text/xml"));
	};

	const reqHandler = (r, c) => {
		if (!r.ok) {
			return r.text().then(t => {
				var message;
				if (a = t.match(/<((?:\w+:)?message)>(.*)<\/\1>/)) {
					message = "\n" + a[2];
				}

				throw new Error(r.status + ' ' + r.statusText + message);
			});
		}
		window.setTimeout(c, 200);
		return r;
	};

	const reqAndReload = (method, url, body, headers) => {
		animateLoading();
		req(method, url, body, headers).then(r => reqHandler(r, () => {
			stopLoading();
			browser.reload();
		})).catch(e => {
			console.error(e);
			alert(e);
		});
		return false;
	};

	const req = (method, url, body, headers) => {
		return dav.send(method, url, body, headers);
	};

	const uploadFiles = (files) => {
		animateLoading();

		(async () => {
			for (var i = 0; i < files.length; i++) {
				var f = files[i];
				await reqOrError('PUT', current_url + encodeURIComponent(f.name), f);
			}

			window.setTimeout(() => {
				browser.reload();
			}, 500);
		})();
	};

	const reqOrError = (method, url, body) => {
		return req(method, url, body).then(reqHandler).catch(e => {
			console.error(e);
			alert(e);
			browser.reload();
			throw e;
		});
	}

	const preview = (type, url) => {
		if (type.match(/^image\//)) {
			browser.openDialog(`<img src="${url}" />`, false);
		}
		else if (type.match(/^audio\//)) {
			browser.openDialog(`<audio controls="true" autoplay="true" src="${url}" />`, false);
		}
		else if (type.match(/^video\//)) {
			browser.openDialog(`<video controls="true" autoplay="true" src="${url}" />`, false);
		}
		else if (type.match(/pdf/)) {
			browser.openDialog(`<iframe src="${url}" />`, false);
		}
		else {
			browser.openDialog(`<iframe sandbox="" src="${url}" />`, false);
		}

		$('dialog').className = 'preview';
	};

	const animateLoading = () => {
		document.body.classList.add('loading');
	};

	const stopLoading = () => {
		document.body.classList.remove('loading');
	};

	var items = [[], []];
	var current_url = url;
	var base_url = url;
	const user = options.user || null;
	const password = options.password || null;
	dav.setAuth(user, password);

	if (location.pathname.indexOf(base_url) === 0) {
		current_url = location.pathname;
	}

	if (!base_url.match(/^https?:/)) {
		base_url = location.href.replace(/^(https?:\/\/[^\/]+\/).*$/, '$1') + base_url.replace(/^\/+/, '');
	}

	var evt, paste_upload, popstate_evt;
	var sort_order = window.localStorage.getItem('sort_order') || 'name';
	var sort_order_desc = !!parseInt(window.localStorage.getItem('sort_order_desc'), 10);

	wopi.discovery_url = options.wopi_discovery_url || null;
	options.autosave = options.autosave || false;

	// Wait for WOPI discovery before creating the list
	if (wopi.discovery_url) {
		await wopi.init(wopi.discovery_url);
	}

	browser.init();
	browser.open(current_url);

	window.addEventListener('paste', (e) => {
		let items = e.clipboardData.items;
		const IMAGE_MIME_REGEX = /^image\/(p?jpeg|gif|png)$/i;

		for (var i = 0; i < items.length; i++) {
			if (items[i].kind === 'file' || IMAGE_MIME_REGEX.test(items[i].type)) {
				e.preventDefault();
				let f = items[i].getAsFile();
				let name = f.name == 'image.png' ? f.name.replace(/\./, '-' + (+(new Date)) + '.') : f.name;

				paste_upload = f;

				browser.openDialog(paste_upload_dialog);

				let t = $('input[name=paste_name]');
				t.value = name;
				t.focus();
				t.selectionStart = 0;
				t.selectionEnd = name.lastIndexOf('.');

				document.forms[0].onsubmit = () => {
					name = encodeURIComponent(t.value);
					return reqAndReload('PUT', current_url + name, paste_upload);
				};

				return;
			}
		}
	});

	var dragcounter = 0;

	window.addEventListener('dragover', (e) => {
		e.preventDefault();
		e.stopPropagation();
	});

	window.addEventListener('dragenter', (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (!dragcounter) {
			document.body.classList.add('dragging');
		}

		dragcounter++;
	});

	window.addEventListener('dragleave', (e) => {
		e.preventDefault();
		e.stopPropagation();
		dragcounter--;

		if (!dragcounter) {
			document.body.classList.remove('dragging');
		}
	});

	window.addEventListener('drop', (e) => {
		e.preventDefault();
		e.stopPropagation();
		document.body.classList.remove('dragging');
		dragcounter = 0;

		var files = [...e.dataTransfer.items].map(item => item.getAsFile());

		files = files.filter(f => f !== null);

		if (!files.length) return;

		uploadFiles(files);
	});
};

if (url = document.querySelector('html').getAttribute('data-webdav-url')) {
	WebDAVNavigator(url, {
		'wopi_discovery_url': document.querySelector('html').getAttribute('data-wopi-discovery-url'),
		'nc_thumbnails': document.querySelector('html').getAttribute('data-nc-thumbnails') ? true : false
	});
}
