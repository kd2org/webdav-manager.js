var browser = {
	files: {},
	selection: {},
	paste_selection: [],
	paste_action: null,
	sort_order: 'name',
	sort_order_desc: false
};

browser.openDialog = (html, ok_btn = true) => {
	var tpl = dialog_tpl.replace(/%b/, ok_btn ? `<p><input type="submit" value="${_('OK')}" /></p>` : '');
	$('body').classList.add('dialog');
	$('body').insertAdjacentHTML('beforeend', tpl.replace(/%s/, html));
	$('.close input').onclick = browser.closeDialog;
	evt = window.addEventListener('keyup', (e) => {
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
	window.removeEventListener('keyup', evt);
	evt = null;
};


browser.init = () => {
	document.title = _('My files');
	document.querySelector('html').innerHTML = html_tpl;
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
};

browser.open = function (url, push_history, focus_file) {
	browser.closeDialog();
	browser.url = normalizeURL(url);

	// Show order in correct column
	$('thead td[data-sort="' + browser.sort_order + '"]').className += ' selected ' + (browser.sort_order_desc ? 'desc' : 'asc');

	dav.list(url).then(files => {
		browser.root = files['.'];
		delete files['.'];
		browser.files = files;

		if (Object.keys(browser.selection).length) {
			browser.cancelSelection();
		}

		var title = browser.root.name;

		if (browser.root.url === base_url) {
			title = _('My files');
		}

		document.title = title;

		browser.setRootPermissions(browser.root.permissions);
		browser.createFilesList();

		changeURL(browser.url, push_history);

		if (focus_file) {
			browser.focusFile(focus_file);
		}

		css.show('table');
	});
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

	// Add link to parent directory
	if (browser.root.url !== base_url) {
		rows += parent_row_tpl;
	}

	items.forEach(item => {
		// Don't include files we cannot read
		if (item.permissions !== null
			&& !item.permissions.includes(PERM_READ)) {
			console.error('OC permissions deny read access to this file: ' + item.name, 'Permissions: ', item.permissions);
			return;
		}

		var row = file_row_tpl;
		item.size_bytes = item.size !== null ? utils.formatBytes(item.size).replace(/ /g, '&nbsp;') : null;

		item.icon = (item.extension || '').toUpperCase();
		item.class = item.is_dir ? 'dir' : 'file';
		item.modified = item.modified !== null ? utils.formatDate(item.modified) : null;
		item.name = html(item.name);

		if (item.mime && item.mime.match(/^image\//) && options.nc_thumbnails) {
			item.thumb = template(image_thumb_tpl, item);
		}
		else {
			item.thumb = template(icon_tpl, item);
		}

		rows += template(row, item);
	});

	document.querySelector('main > table > tbody').innerHTML = rows;

	document.querySelectorAll('table tbody tr').forEach(browser.createRowActions);
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
	var hideButton = a => document.querySelector('.buttons .' + a).style.display = 'none';

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

browser.createRowActions = (tr) => {
	// Ignore parent row
	if (tr.classList.contains('parent')) {
		tr.querySelector('a').onclick = () => {
			browser.open(dirname(browser.root.url));
			return false;
		};
		return;
	}

	var $$ = (a) => tr.querySelector(a);
	var url = $$('a').href;
	var url_name = decodeURIComponent(basename(url.replace(/\/$/, '')));
	var file = browser.files[url_name];

	browser.setRowPermissions(tr, file);

	var dir = $$('[colspan]');
	var buttons = $$('td.buttons div');

	var checkbox = $$('input[type=checkbox]');
	checkbox.onchange = () => {
		var file = browser.files[url_name];

		if (checkbox.checked) {
			browser.selection[file.name] = file;
		}
		else {
			delete browser.selection[file.name];
		}

		browser.updateSelection();
	};

	if (file.is_dir) {
		$$('a').onclick = () => {
			browser.open(file.url, true);
			return false;
		};

		return;
	}

	$$('.buttons .rename').onclick = () => {
		browser.openDialog(rename_dialog);
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
		browser.openDialog(delete_dialog);
		document.forms[0].onsubmit = () => {
			dav.send('DELETE', file.url);
			browser.reload(name);
			return false;
		};
	};

	if (!file.is_dir) {
		$$('.buttons .download').onclick = () => browser.downloadSingleFile(file);
	}

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
			$('.md_preview').innerHTML = editor.markdownToHTML(t);
		});
		return false;
	}

	if (user && password) {
		(async () => { preview(file.mime, await get_url(file.url)); })();
	}
	else {
		preview(file.mime, file.url);
	}

	return false;
};

browser.editTextFile = (file) => {
	req('GET', file.url).then((r) => r.text().then((t) => {
		let md = file.url.match(/\.md$/i);
		var tpl = dialog_tpl.replace(/%b/, '');
		$('body').classList.add('dialog');
		$('body').insertAdjacentHTML('beforeend', tpl.replace(/%s/, md ? markdown_dialog : edit_dialog));

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

		var c = localStorage.getItem('autosave') ?? options.autosave;
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
				pre.innerHTML = editor.markdownToHTML(txt.value);
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
	stopLoading();
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
	if (action === 'move' && browser.root.url === dirname(file.url)) {
		alert(_('Cannot move to the same directory'));
		return;
	}

	var filename = browser.getFreeFilename(file.name);
	return dav.copymove(action === 'copy' ? 'COPY' : 'MOVE', file.url, browser.root.url + encodeURIComponent(filename), false);
};

browser.applyPasteSelection = async function () {
	animateLoading();

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
	window.URL.revokeObjectURL(url)
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
	var zip_name = (browser.root.url === base_url) ? 'files.zip' : browser.root.name + '.zip';

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

	browser.openDialog(delete_dialog);
	document.forms[0].onsubmit = () => {
		animateLoading();

		for (var i = 0; i < l.length; i++) {
			dav.send('DELETE', )
			reqOrError('DELETE', l[i].value);
		}

		// Don't reload too fast
		window.setTimeout(() => {
			stopLoading();
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
			browser.openDialog(mkfile_dialog);
			var t = $('input[name=mkfile]');
			var ext = btn.className.substr(-3).toLowerCase();
			t.focus();
			document.forms[0].onsubmit = () => {
				var name = t.value;
				browser.closeDialog();

				if (!name) return false;

				name = encodeURIComponent(name + '.' + ext);
				var file_url = current_url + name;

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
		browser.openDialog(mkdir_dialog);
		document.forms[0].onsubmit = () => {
			var name = $('input[name=mkdir]').value;

			if (!name) return false;

			var new_url = current_url + encodeURIComponent(name);

			dav.send('MKCOL', new_url).then(() => browser.open(new_url + '/', true));
			return false;
		};
	};

	$('.mktext').onclick = () => {
		toggle_menu();
		browser.openDialog(mkfile_dialog);
		var t = $('input[name=mkfile]');
		t.value = '.md';
		t.focus();
		t.selectionStart = t.selectionEnd = 0;
		document.forms[0].onsubmit = () => {
			var name = t.value;

			if (!name) return false;

			dav.send('PUT', current_url + encodeURIComponent(name), '');
			browser.reload(name);
			return false;
		};
	};

	var fi = $('input[type=file]');

	$('.upload').onclick = () => fi.click();

	fi.onchange = () => {
		if (!fi.files.length) return;
		uploadFiles(fi.files);
	};
};

browser.setRootPermissions = (perms) => {
	css.toggle('.toolbar .create', perms.includes(PERM_CREATE) || perms.includes(PERM_MKDIR));
};
