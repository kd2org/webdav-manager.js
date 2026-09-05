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
	css.animateLoading();
	req(method, url, body, headers).then(r => reqHandler(r, () => {
		css.stopLoading();
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

const reqOrError = (method, url, body) => {
	return req(method, url, body).then(reqHandler).catch(e => {
		console.error(e);
		alert(e);
		browser.reload();
		throw e;
	});
}

const PREVIEW_TYPES = /^image\/(png|webp|svg|jpeg|jpg|gif|png)|^application\/pdf|^text\/|^audio\/|^video\/|application\/x-empty/;
const PREVIEW_EXTENSIONS = /\.(?:png|webp|svg|jpeg|jpg|gif|png|pdf|txt|css|js|html?|md|mp4|mkv|webm|ogg|flac|mp3|aac|m4a|avi)$/i;

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

const _ = key => browser.lang in browser.lang_strings && key in browser.lang_strings[browser.lang] ? browser.lang_strings[browser.lang] : key;

var browser = {
	// Root of server, eg. http://nextcloud.example.com/
	server_url: null,
	// Root of user WebDAV path, eg. http://nextcloud.example.com/dav/files/user/
	webdav_url: null,
	files: {},
	selection: {},
	paste_selection: [],
	popstate_event: null,
	close_event: null,
	paste_action: null,
	lang_strings: {},
	lang: 'en',
	templates: {},

	// Preferences
	sort_order: 'name',
	sort_order_desc: false,
	autosave: false,

	// Settings
	enable_thumbnails: null,
	is_nextcloud: null,
};

browser.openDialog = (html, ok_btn = true) => {
	var tpl = browser.templates.dialog.replace(/%b/, ok_btn ? `<p><input type="submit" value="${_('OK')}" /></p>` : '');
	$('body').classList.add('dialog');
	$('body').insertAdjacentHTML('beforeend', tpl.replace(/%s/, html));
	$('.close input').onclick = browser.closeDialog;
	browser.close_event = window.addEventListener('keyup', (e) => {
		if (e.key != 'Escape') return;
		browser.closeDialog();
		return false;
	});
	if (a = $('dialog form input, dialog form textarea')) a.focus();
	return $('dialog');
};

browser.replaceDialog = (html, ok_btn = true) => {
	browser.closeDialog();
	return browser.openDialog(html, ok_btn);
};

browser.closeDialog = (e) => {
	if (!$('body').classList.contains('dialog')) {
		return;
	}

	if (dav.current_xhr) {
		dav.current_xhr.abort();
		dav.current_xhr = null;
	}

	$('body').classList.remove('dialog');
	if (!$('dialog')) return;
	$('dialog').remove();
	window.removeEventListener('keyup', browser.close_event);
	evt = null;
};

browser.init = async (url, options) => {
	browser.lang = options.lang || null;
	browser.lang ??= navigator.language.substr(0, 2).toLowerCase();

	// Restore preferences
	browser.sort_order = window.localStorage.getItem('sort_order') || 'name';
	browser.sort_order_desc = !!parseInt(window.localStorage.getItem('sort_order_desc'), 10);

	// events
	window.addEventListener('paste', browser.pasteFile);
	browser.enableDragDrop();

	window.addEventListener('beforeunload', () => {
		// Cancel any current download
		if (dav.current_xhr) {
			dav.current_xhr.abort();
		}

		return true;
	});

	browser.populateTemplates();

	document.title = _('My files');
	document.querySelector('body').innerHTML = browser.templates.body;
	css.all('head style').forEach(e => e.remove());
	browser.createToolbar();

	// Create actions for sorting buttons
	document.querySelectorAll('thead td[data-sort] button').forEach(elm => elm.onclick = (e) => {
		$('thead td[data-sort="' + browser.sort_order + '"]').classList.remove('selected', 'desc', 'asc');
		var new_sort_order = e.target.parentNode.dataset.sort;

		if (browser.sort_order == new_sort_order) {
			browser.sort_order_desc = !browser.sort_order_desc;
		}

		browser.sort_order = new_sort_order;

		window.localStorage.setItem('sort_order', new_sort_order);
		window.localStorage.setItem('sort_order_desc', browser.sort_order_desc ? '1' : '0');
		browser.reload();
	});

	// Check all by checking box in table header
	document.querySelector('thead td.check input').onchange = (e) => {
		document.querySelectorAll('tbody td.check input').forEach(i => {
			if (e.target.checked !== i.checked) {
				i.click();
			}
		});
	};

	dav.setAuth(options.user || null, options.password || null);

	if (null === url) {
		url = location.pathname;
	}

	if (!url.match(/^https?:/)) {
		url = location.href.replace(/^(https?:\/\/[^\/]+\/).*$/, '$1') + url.replace(/^\/+/, '');
	}

	browser.server_url = options.server_url || url;
	browser.webdav_url = options.webdav_url || url;
	browser.autosave = options.autosave || false;
	wopi.discovery_url = options.wopi_discovery_url || null;

	// Wait for WOPI discovery before creating the list
	if (wopi.discovery_url) {
		await wopi.init(wopi.discovery_url);
	}

	browser.open(url);
};

browser.open = function (url, push_history, focus_file) {
	browser.closeDialog();
	browser.url = utils.normalizeURL(url);

	// Show order in correct column
	$('thead td[data-sort="' + browser.sort_order + '"]').className += ' selected ' + (browser.sort_order_desc ? 'desc' : 'asc');

	dav.list(url).then(files => {
		if (!('.' in files)) {
			console.log(url, push_history, focus_file, files);
			throw 'Missing root';
		}

		browser.root = files['.'];
		delete files['.'];
		browser.files = files;

		if (Object.keys(browser.selection).length) {
			browser.cancelSelection();
		}

		var title = browser.root.name;

		if (browser.root.url === browser.webdav_url) {
			title = _('My files');
		}

		document.title = title;

		if (browser.root.permissions.length && browser.is_nextcloud === null) {
			browser.is_nextcloud = true;
			browser.enable_thumbnails ??= true;
		}

		browser.setRootPermissions(browser.root.permissions);
		browser.createFilesList();

		browser.changeURL(browser.root.url, push_history);

		if (focus_file) {
			browser.focusFile(focus_file);
		}

		css.show('table');
	});
};

browser.changeURL = (uri, push) => {
	try {
		if (push) {
			history.pushState(1, null, uri);
		}
		else {
			history.replaceState(1, null, uri);
		}

		if (browser.popstate_event) return;

		browser.popstate_event = window.addEventListener('popstate', (e) => {
			var url = location.pathname;
			browser.open(url, false);
		});
	}
	catch (e) {
		// If using a HTML page on another origin
		location.hash = uri;
	}
};

browser.createFilesList = () => {
	var items = Object.values(browser.files);

	// Sort files using specified order
	items.sort((a, b) => {
		if (browser.sort_order === 'date') {
			return a.modified - b.modified;
		}
		else if (browser.sort_order === 'size') {
			return a.size - b.size;
		}
		else {
			return a.name.localeCompare(b.name);
		}
	});

	// Sort with directories first
	if (browser.sort_order !== 'date') {
		items.sort((a, b) => b.is_dir - a.is_dir);
	}

	if (browser.sort_order_desc) {
		items = items.reverse();
	}

	var rows = '';
	var tbody = document.querySelector('table tbody');
	tbody.innerHTML = '';

	// Add link to parent directory
	if (browser.root.url !== browser.webdav_url) {
		tbody.innerHTML += browser.templates.parent_row;

		tbody.firstChild.querySelector('a').onclick = () => {
			browser.open(utils.dirname(browser.root.url));
			return false;
		};
	}

	items.forEach(item => {
		// Don't include files we cannot read
		if (item.permissions !== null
			&& !item.permissions.includes(PERM_READ)) {
			console.error('OC permissions deny read access to this file: ' + item.name, 'Permissions: ', item.permissions);
			return;
		}

		item.icon = (item.extension || '').toUpperCase();
		/*
		item.size_bytes = item.size !== null ? utils.formatBytes(item.size).replace(/ /g, '&nbsp;') : null;

		item.class = item.is_dir ? 'dir' : 'file';
		item.modified = item.modified !== null ? utils.formatDate(item.modified) : null;
		item.name = utils.html(item.name);
		*/

		if (item.has_thumbnail && browser.enable_thumbnails) {
			item.thumb = '<img alt="" src="' + browser.getThumbnailURL(file.url, 150) + '" />';
		}
		else {
			item.thumb = browser.template('icon', item);
		}

		//let row = browser.template('file_row', item);
		let row = browser.templates.row.cloneNode(true);
		row.dataset.name = item.name;
		row.className = item.is_dir ? 'dir' : 'file';
		row.querySelector('a').innerHTML = item.thumb + utils.html(item.name);
		row.querySelector('td.size').innerHTML = item.size !== null ? utils.formatBytes(item.size).replace(/ /g, '&nbsp;') : null;
		row.querySelector('td.date').innerText = item.modified !== null ? utils.formatDate(item.modified) : '';
		tbody.appendChild(row);
		browser.setRowActions(row, item);
	});

	//document.querySelector('main > table > tbody').innerHTML = rows;

	//document.querySelectorAll('table tbody tr').forEach(browser.createRowActions);
};

browser.cancelSelection = () => {
	css.hide('.toolbar .selection');
	browser.selection = {};

	if (browser.paste_selection.length) {
		browser.paste_selection = [];
		browser.paste_action = null;
		css.hide('.toolbar .paste');
	}

	browser.unselectAll();
};

browser.unselectAll = () => {
	Object.values(browser.files).forEach(f => f.selected = false);
	css.all('table input[type=checkbox]:checked').forEach(e => e.checked = false);
};

browser.updateSelection = () => {
	css.show('.selection .buttons, .selection .buttons .delete, .selection .buttons .copy, .selection .buttons .cut');
	var file_count = 0;
	var dir_count = 0;

	for (var key in browser.selection) {
		if (!browser.selection.hasOwnProperty(key)) {
			continue;
		}

		let file = browser.selection[key];

		dir_count += file.is_dir ? 1 : 0;
		file_count += !file.is_dir ? 1 : 0;

		if (!file.permissions.includes(PERM_DELETE)) {
			css.hide('.selection .buttons .delete');
		}

		if (!file.permissions.includes(PERM_MOVE)) {
			css.hide('.selection .buttons  .cut');
		}

		if (!browser.root.permissions.includes(PERM_CREATE)) {
			css.hide('.selection .buttons  .copy');
		}
	}

	// Hide selected files menu
	if (!file_count && !dir_count) {
		css.hide('.toolbar .selection');
		return;
	}

	css.show('.toolbar .selection');

	var count = $('.toolbar .selection .count');
	count.innerHTML = '<span class="prefix">' + _('Selected:') + '</span>';

	if (dir_count) {
		let msg = _('%d directories').replace('%d', dir_count);
		count.innerHTML += '<span class="directories">' + msg + '</span>';
	}

	if (file_count) {
		let msg = _('%d files').replace('%d', file_count);
		count.innerHTML += '<span class="files">' + msg + '</span>';
	}
};

browser.setRowPermissions = (tr, file) => {
	var p = file.permissions;
	var hideButton = a => tr.querySelector('.buttons .' + a).style.display = 'none';

	if (!p.includes(PERM_RENAME)) {
		hideButton('rename');
	}

	if (!p.includes(PERM_DELETE)) {
		hideButton('delete');
	}

	if (file.is_dir || !p.includes(PERM_WRITE)) {
		hideButton('edit');
	}

	if (!p.includes(PERM_SHARE)) {
		//hideButton('share');
	}

	if (!p.includes(PERM_SHARED)) {
		//hideButton('shared');
	}

	// if (mime.match(/^text\/|application\/x-empty/))
};

browser.setRowActions = (tr, file) => {
	var $$ = (a) => tr.querySelector(a);

	browser.setRowPermissions(tr, file);

	$$('a').href = file.url;

	var checkbox = $$('input[type=checkbox]');
	checkbox.onchange = () => {
		if (checkbox.checked) {
			browser.selection[file.name] = file;
		}
		else {
			delete browser.selection[file.name];
		}

		browser.updateSelection();
	};

	$$('.buttons .rename').onclick = () => {
		browser.openDialog(browser.templates.rename_dialog);
		let t = $('input[name=rename]');
		t.value = file.name;
		t.focus();
		t.selectionStart = 0;
		t.selectionEnd = file.name.lastIndexOf('.');
		document.forms[0].onsubmit = () => {
			var name = t.value.trim();

			if (!name) return false;

			var new_url = browser.root.url + encodeURIComponent(name);

			dav.copymove('MOVE', file.url, new_url, false);
			browser.reload(name);
			return false;
		};
	};

	$$('.buttons .delete').onclick = (e) => {
		browser.openDialog(browser.templates.delete_dialog);
		document.forms[0].onsubmit = () => {
			dav.send('DELETE', file.url);
			browser.reload(name);
			return false;
		};
	};

	if (file.is_dir) {
		$$('a').onclick = () => {
			browser.open(file.url, true);
			return false;
		};
		$$('.buttons .download').style.display = 'none';

		return;
	}

	$$('.buttons .download').onclick = () => browser.downloadSingleFile(file);

	var edit_url, view_url;
	$$('.buttons .edit').style.display = 'none';
	var allow_preview = false;

	// Don't preview PDF in mobile, it doesn't work
	if ((file.mime == 'application/pdf' || file.name.match(/\.pdf$/i))
		&& window.navigator.userAgent.match(/Mobi|Tablet|Android|iPad|iPhone/)) {
		allow_preview = false;
	}
	else if (file.mime.match(PREVIEW_TYPES)
		|| file.name.match(PREVIEW_EXTENSIONS)) {
		allow_preview = true;
	}

	if (file.permissions.includes(PERM_WRITE)
		&& (file.mime.match(/^text\/|application\/x-empty/)
			|| file.name.match(/\.(md|txt)$/i)
			|| (edit_url = wopi.getEditURL(file.url, file.mime)))) {
		if (edit_url)  {
			var action = () => { wopi.open(file.url, edit_url); return false; };
			$$('.icon').classList.add('document');
			allow_preview = false;
		}
		else {
			allow_preview = !file.name.match(/\.md$/);
			var action = () => { browser.editTextFile(file); return false; };
		}

		$$('.buttons .edit').style.display = null;
		$$('.buttons .edit').onclick = action;

		if (!allow_preview) {
			$$('th a').onclick = action;
		}
	}
	// Open WOPI viewser
	else if (view_url = wopi.getViewURL(file.url, file.mime)) {
		$$('.icon').classList.add('document');
		$$('th a').onclick = () => { wopi.open(file.url, view_url); return false; };
	}
	else if (!file.is_dir) {
		$$('th a').download = file.name;
		$$('th a').href = file.url;
	}


	if (allow_preview) {
		$$('th a').onclick = () => { browser.openPreview(file); return false; };
	}
};

browser.openPreview = (file) => {
	if (file.name.match(/\.md$/i)) {
		browser.openDialog('<div class="md_preview"></div>', false);
		$('dialog').className = 'preview';
		req('GET', file.url).then(r => r.text()).then(t => {
			$('.md_preview').innerHTML = markdownToHTML(t);
		});
		return false;
	}

	// If we need a login, loading the file as an external object won't work
	if (dav.auth) {
		browser.downloadSingleFile(file);
		return false;
	}

	if (file.mime.match(/^image\//)) {
		browser.openDialog(`<img src="${file.url}" />`, false);
	}
	else if (file.mime.match(/^audio\//)) {
		browser.openDialog(`<audio controls="true" autoplay="true" src="${file.url}" />`, false);
	}
	else if (file.mime.match(/^video\//)) {
		browser.openDialog(`<video controls="true" autoplay="true" src="${file.url}" />`, false);
	}
	else if (file.mime.match(/pdf/)) {
		browser.openDialog(`<iframe src="${file.url}" />`, false);
	}
	else {
		browser.openDialog(`<iframe sandbox="" src="${file.url}" />`, false);
	}

	$('dialog').className = 'preview';
	return false;
};

browser.editTextFile = (file) => {
	req('GET', file.url).then((r) => r.text().then((t) => {
		let md = file.url.match(/\.md$/i);
		var tpl = browser.templates.dialog.replace(/%b/, '');
		$('body').classList.add('dialog');
		$('body').insertAdjacentHTML('beforeend', tpl.replace(/%s/, md ? browser.templates.markdown_dialog : browser.templates.edit_dialog));

		var tb = $('.close');
		tb.className = 'toolbar';
		tb.innerHTML = `<input type="button" value="&#x2716; ${_('Cancel')}" class="close" />
			<label><input type="checkbox" class="autosave" /> ${_('Autosave')}</label>
			<span class="status"></span>
			<input class="save" type="button" value="${_('Save and close')}" />`;

		var txt = $('textarea[name=edit]');
		txt.value = t;

		var saved_status = $('.toolbar .status');
		var close_btn = $('.toolbar .close');
		var save_btn = $('.toolbar .save');
		var autosave = $('.toolbar .autosave');

		var c = localStorage.getItem('autosave') ?? browser.autosave;
		autosave.checked = c == 1 || c ===  true;
		autosave.onchange = () => {
			localStorage.setItem('autosave', autosave.checked ? 1 : 0);
		};

		var preventClose = (e) => {
			if (txt.value == t) {
				return;
			}

			e.preventDefault();
			e.returnValue = '';
			return true;
		};

		var close = () => {
			if (txt.value !== t) {
				if (!confirm(_('Your changes have not been saved. Do you want to cancel WITHOUT saving?'))) {
					return;
				}
			}

			window.removeEventListener('beforeunload', preventClose, {capture: true});
			browser.closeDialog();
		};

		var save = () => {
			reqOrError('PUT', file.url, txt.value);
			t = txt.value;
			updateSaveStatus();
		};

		var updateSaveStatus = () => {
			saved_status.innerHTML = txt.value !== t ? '⚠️ ' + _('Modified') : '✔️ ' + _('Saved');
		};

		save_btn.onclick = () => { save(); close(); };
		close_btn.onclick = close;

		// Prevent close of tab if content has changed and is not saved
		window.addEventListener('beforeunload', preventClose, { capture: true });

		txt.onkeydown = (e) => {
			if (e.ctrlKey && e.key == 's') {
				save();
				e.preventDefault();
				return false;
			}
			else if (e.key === 'Escape') {
				close();
				e.preventDefault();
				return false;
			}
		};

		txt.onkeyup = (e) => {
			updateSaveStatus();
		};

		window.setInterval(() => {
			if (autosave.checked && t != txt.value) {
				save();
			}
		}, 10000);

		// Markdown editor
		if (md) {
			let pre = $('.md_preview');

			txt.oninput = () => {
				pre.innerHTML = markdownToHTML(txt.value);
			};

			txt.oninput();

			// Sync scroll, not perfect but better than nothing
			txt.onscroll = (e) => {
				var p = e.target.scrollTop / (e.target.scrollHeight - e.target.offsetHeight);
				var target = e.target == pre ? txt : pre;
				target.scrollTop = p * (target.scrollHeight - target.offsetHeight);
				e.preventDefault();
				return false;
			};
		}

		document.forms[0].onsubmit = () => {
			var content = txt.value;

			return reqAndReload('PUT', file.url, content);
		};
	}));
};

browser.reload = function (focus_file) {
	browser.closeDialog();
	css.stopLoading();
	browser.open(browser.url, false, focus_file);
};

browser.focusFile = (name) => {
	css.all('tr[data-name]').forEach(tr => {
		tr.classList.remove('focus');

		if (tr.dataset.name == name) {
			tr.classList.add('focus');

			if (!css.isVisible(tr)) {
				tr.scrollIntoView({block: 'center', behavior: 'smooth'});
			}
		}
	});
};

browser.getFreeFilename = function (filename) {
	var increment_filename = (filename) => filename.replace(/(?:\s+\((\d+)\))?(\.[^.]+)?$/, (_, i, ext) => {
		var i = parseInt(i || 0, 10) + 1;
		return ' (' + i + ')' + (ext || '');
	});

	var j = 0;

	while (browser.files.hasOwnProperty(filename)) {
		filename = increment_filename(filename);

		if (j++ > 100) {
			break;
		}
	}

	return filename;
};

browser.pasteTo = function (file, action) {
	// Don't do anything if cutting and pasting in the same directory
	if (action === 'move' && browser.root.url === utils.dirname(file.url)) {
		alert(_('Cannot move to the same directory'));
		return;
	}

	var filename = browser.getFreeFilename(file.name);
	return dav.copymove(action === 'copy' ? 'COPY' : 'MOVE', file.url, browser.root.url + encodeURIComponent(filename), false);
};

browser.applyPasteSelection = async function () {
	css.animateLoading();

	for (var i = 0; i < browser.paste_selection.length; i++) {
		await browser.pasteTo(browser.paste_selection[i], browser.paste_action);
	}

	browser.cancelSelection();
	browser.reload();
};

browser.createPasteSelection = (action) => {
	browser.assertFilesAreSelected();

	browser.paste_selection = Object.values(browser.selection);
	browser.paste_action = action;
	browser.selection = {};
	browser.unselectAll();

	css.show('.toolbar .selection, .toolbar .paste, .toolbar .paste .copy, .toolbar .paste .move'); // re-enable selection, as it was hidden by cancelSelection
	css.hide('.toolbar .buttons');

	if (action === 'move') {
		css.hide('.toolbar .paste .copy');
	}
	else {
		css.hide('.toolbar .paste .move');
	}
};

browser.download = async (file) => {
	var progress = (e) => {
		var p = $('progress');
		if (!p || e.loaded <= 0) return;
		p.value = parseInt(p.dataset.downloaded || 0, 10) + e.loaded;
		$('.progress_bytes').innerHTML = utils.formatBytes(p.value);
	};

	if ($('dialog')) {
		var p = $('progress');
		p.dataset.downloaded = parseInt(p.dataset.downloaded || 0, 10) + parseInt(p.dataset.current || 0, 10);
		p.dataset.current = file.size;
		$('dialog h3').innerText = file.name;
	}

	return dav.xhr('GET', file.url, progress);
};

browser.openProgress = (size) => {
	browser.replaceDialog(`<p class="spinner"><span></span></p>
		<h3>…</h3>
		<progress max="${size}"></progress>
		<p><span class="progress_bytes"></span> / ${utils.formatBytes(size)}</p>`, false);
};

browser.downloadBlob = (blob, name) => {
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	window.URL.revokeObjectURL(url);
};

browser.downloadToBrowser = async (file) => {
	var blob = await browser.download(file);
	browser.downloadBlob(blob, file.name);
};

browser.downloadSingleFile = async (file) => {
	browser.openProgress(file.size);
	await browser.downloadToBrowser(file).then(() => browser.closeDialog());
	browser.closeDialog();
};

browser.assertFilesAreSelected = () => {
	if (!Object.keys(browser.selection).length) {
		alert(_('No file is selected'));
		throw 'No file is selected';
	}
};

browser.getSelectedFilesOnly = (max_size) => {
	var files = [];
	var size = 0;

	for (var key in browser.selection) {
		if (!browser.selection.hasOwnProperty(key)) {
			continue;
		}

		var file = browser.selection[key];

		// Ignore directories
		if (file.is_dir) {
			continue;
		}

		files.push(file);
		size += file.size;

		if (size >= max_size) {
			alert(_('Cannot process: max file size is 4GB'));
			throw 'Max file size fail';
		}
	}

	if (!files.length) {
		alert(_('No file is selected'));
		throw 'No file is selected';
	}

	return [files, size];
};

browser.downloadSelectedFiles = async () => {
	[files, size] = browser.getSelectedFilesOnly();
	browser.openProgress(size);

	for (var i = 0; i < files.length; i++) {
		await browser.downloadToBrowser(files[i]);
	}

	browser.closeDialog();
};

browser.zipSelectedFiles = async () => {
	await js.zipwriter();

	[files, size] = browser.getSelectedFilesOnly(4*1024*1024*1024);
	var zip_name = (browser.root.url === browser.webdav_url) ? 'files.zip' : browser.root.name + '.zip';

	const zip = new ZipWriter();

	// For Chrome/others
	if ('showSaveFilePicker' in window) {
		var handle = await showSaveFilePicker({
			suggestedName: zip_name
		});
		zip.stream().pipeTo(await handle.createWritable());
	}
	else {
		var handle = null;
	}

	browser.openProgress(size);

	for (const file of files) {
		await browser.download(file).then(blob => zip.addBlob(file.name, blob));
	}

	const blob = await zip.close();

	if (null === handle) {
		browser.downloadBlob(blob, zip_name);
	}

	browser.closeDialog();
};

browser.deleteSelectedFiles = () => {
	browser.assertFilesAreSelected();

	var l = document.querySelectorAll('input[name=delete]:checked');

	browser.openDialog(browser.templates.delete_dialog);
	document.forms[0].onsubmit = () => {
		css.animateLoading();

		for (var i = 0; i < l.length; i++) {
			dav.send('DELETE', )
			reqOrError('DELETE', l[i].value);
		}

		// Don't reload too fast
		window.setTimeout(() => {
			css.stopLoading();
			browser.reload();
		}, 500);
	};
};

browser.createToolbar = () => {
	$('.selection .buttons .download').onclick = browser.downloadSelectedFiles;
	$('.selection .buttons .zip').onclick = browser.zipSelectedFiles;
	$('.selection .buttons .copy').onclick = () => browser.createPasteSelection('copy');
	$('.selection .buttons .cut').onclick = () => browser.createPasteSelection('move');
	$('.selection .buttons .delete').onclick = browser.deleteSelectedFiles;
	$('.selection .cancel').onclick = browser.cancelSelection;
	$('.selection .paste .copy').onclick = browser.applyPasteSelection;
	$('.selection .paste .move').onclick = browser.applyPasteSelection;
	$('.toolbar .paste .move, .toolbar .paste .copy').onclick = browser.applyPasteSelection;

	// Hide stuff that can only be used if permissions allow
	css.hide('.toolbar .create, .selection .buttons .copy, .selection .buttons  .cut, .selection .buttons .delete, .toolbar .menu, .toolbar .menu .wopi, .toolbar .paste');

	var menu = $('.toolbar .menu');
	menu.dataset.visible = '0';

	var toggle_menu = () => {
		menu.dataset.visible = menu.dataset.visible == 0 ? 1 : 0;
		menu.style.display = menu.dataset.visible == 1 ? 'flex' : 'none';
	};

	$('.toolbar .mk').onclick = toggle_menu;

	if (wopi.extensions) {
		css.show('.toolbar .menu .wopi');

		css.onclick('.toolbar .menu .wopi input', (ev, btn) => {
			toggle_menu();
			browser.openDialog(browser.templates.mkfile_dialog);
			var t = $('input[name=mkfile]');
			var ext = btn.className.substr(-3).toLowerCase();
			t.focus();
			document.forms[0].onsubmit = () => {
				var name = t.value;
				browser.closeDialog();

				if (!name) return false;

				name = encodeURIComponent(name + '.' + ext);
				var file_url = browser.root.url + name;

				// Cannot use atob here, or JS will send blob as unicode text
				fetch('data:application/octet-stream;base64,' + OPENDOCUMENT_TEMPLATES[ext]).then(r => r.blob()).then(r => {
					req('PUT', file_url, r, {'Content-Type': 'application/octet-stream'}).then(() => {
						wopi.open(file_url, wopi.getEditURL(file_url, ext));
					});
				});

				return false;
			};
		});
	}

	$('.mkdir').onclick = () => {
		toggle_menu();
		browser.openDialog(browser.templates.mkdir_dialog);
		document.forms[0].onsubmit = () => {
			var name = $('input[name=mkdir]').value;

			if (!name) return false;

			var new_url = browser.root.url + encodeURIComponent(name);

			dav.send('MKCOL', new_url).then(() => browser.open(new_url + '/', true));
			return false;
		};
	};

	$('.mktext').onclick = () => {
		toggle_menu();
		browser.openDialog(browser.templates.mkfile_dialog);
		var t = $('input[name=mkfile]');
		t.value = '.md';
		t.focus();
		t.selectionStart = t.selectionEnd = 0;
		document.forms[0].onsubmit = () => {
			var name = t.value;

			if (!name) return false;

			dav.send('PUT', browser.root.url + encodeURIComponent(name), '');
			browser.reload(name);
			return false;
		};
	};

	var fi = $('input[type=file]');

	$('.upload').onclick = () => fi.click();

	fi.onchange = () => {
		if (!fi.files.length) return;
		browser.uploadFiles(fi.files);
	};
};

browser.setRootPermissions = (perms) => {
	css.toggle('.toolbar .create', perms.includes(PERM_CREATE) || perms.includes(PERM_MKDIR));
};


browser.pasteFile = (e) => {
	let items = e.clipboardData.items;
	const IMAGE_MIME_REGEX = /^image\/(p?jpeg|gif|png)$/i;

	for (var i = 0; i < items.length; i++) {
		if (items[i].kind === 'file' || IMAGE_MIME_REGEX.test(items[i].type)) {
			e.preventDefault();
			let f = items[i].getAsFile();
			let name = f.name == 'image.png' ? f.name.replace(/\./, '-' + (+(new Date)) + '.') : f.name;

			paste_upload = f;

			browser.openDialog(browser.templates.paste_upload_dialog);

			let t = $('input[name=paste_name]');
			t.value = name;
			t.focus();
			t.selectionStart = 0;
			t.selectionEnd = name.lastIndexOf('.');

			document.forms[0].onsubmit = () => {
				name = encodeURIComponent(t.value);
				return reqAndReload('PUT', browser.root.url + name, paste_upload);
			};

			return;
		}
	}
};

browser.enableDragDrop = () => {
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

		browser.uploadFiles(files);
	});
};

browser.uploadFiles = (files) => {
	css.animateLoading();

	(async () => {
		for (var i = 0; i < files.length; i++) {
			var f = files[i];
			await reqOrError('PUT', browser.root.url + encodeURIComponent(f.name), f);
		}

		window.setTimeout(() => {
			browser.reload();
		}, 500);
	})();
};

browser.getThumbnailURL = (path, size=150) => `${browser.server_url}index.php/apps/files/api/v1/thumbnail/${size}/${size}/${path}`;

browser.populateTemplates = () => {
	browser.templates.mkdir_dialog = `<input type="text" name="mkdir" placeholder="${_('Directory name')}" />`;
	browser.templates.mkfile_dialog = `<input type="text" name="mkfile" placeholder="${_('File name')}" />`;
	browser.templates.rename_dialog = `<input type="text" name="rename" placeholder="${_('New file name')}" />`;
	browser.templates.paste_upload_dialog = `<h3>Upload this file?</h3><input type="text" name="paste_name" placeholder="${_('New file name')}" />`;
	browser.templates.edit_dialog = `<textarea name="edit" cols="70" rows="30"></textarea>`;
	browser.templates.markdown_dialog = `<div id="mdp"><textarea name="edit" cols="70" rows="30"></textarea><div class="md_preview"></div></div>`;
	browser.templates.delete_dialog = `<h3>${_('Confirm delete?')}</h3>`;
	browser.templates.wopi_dialog = `<iframe id="wopi_frame" name="wopi_frame" allow="clipboard-read *; clipboard-write *;" allowfullscreen="true">
		</iframe>`;

	browser.templates.dialog = `<dialog open><p class="close"><input type="button" value="&#x2716; ${_('Close')}" class="close" /></p><form><div>%s</div>%b</form></dialog>`;

	browser.templates.body = `<main>
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
		</main><div class="bg"></div>`;

	browser.templates.parent_row = `<tr class="parent">
		<td class="check"></td>
		<th colspan="2"><a href="../"><span class="icon parent"><b></b></span> ${_('Back')}</a></th>
		<td class="date"></td>
		<td class="buttons"></td>
	</tr>`;

	browser.templates.file_row = `
		<td class="check"><input type="checkbox" /><label><span></span></label></td>
		<th><a></a></th>
		<td class="size"></td>
		<td class="date"></td>
		<td class="buttons">
		<div>
			<input class="icon edit" type="button" value="${_('Edit')}" title="${_('Edit')}" />
			<input class="icon download" type="button" value="${_('Download')}" title="${_('Download')}" />
			<input class="icon rename" type="button" value="${_('Rename')}" title="${_('Rename')}" />
			<input class="icon delete" type="button" value="${_('Delete')}" title="${_('Delete')}" />
		</div>
		</td>`;

	browser.templates.row = document.createElement('tr');
	browser.templates.row.innerHTML = browser.templates.file_row;

	browser.templates.icon = `<span class="icon %icon%"><b>%icon%</b></span>`;
};

browser.template = (name, params) => {
	var tpl = browser.templates[name];

	return tpl.replace(/%(\w+)%/g, (a, b) => {
		return params[b];
	});
};
