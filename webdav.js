var css_url = document.currentScript.src.replace(/\/[^\/]+$/, '') + '/webdav.css';

const WebDAVNavigator = (url, user, password) => {
	// Microdown
	// https://github.com/commit-intl/micro-down
	const microdown=function(){function l(n,e,r){return"<"+n+(r?" "+Object.keys(r).map(function(n){return r[n]?n+'="'+(a(r[n])||"")+'"':""}).join(" "):"")+">"+e+"</"+n+">"}function c(n,e){return e=n.match(/^[+-]/m)?"ul":"ol",n?"<"+e+">"+n.replace(/(?:[+-]|\d+\.) +(.*)\n?(([ \t].*\n?)*)/g,function(n,e,r){return"<li>"+g(e+"\n"+(t=r||"").replace(new RegExp("^"+(t.match(/^\s+/)||"")[0],"gm"),"").replace(o,c))+"</li>";var t})+"</"+e+">":""}function e(r,t,u,c){return function(n,e){return n=n.replace(t,u),l(r,c?c(n):n)}}function t(n,u){return f(n,[/<!--((.|\n)*?)-->/g,"\x3c!--$1--\x3e",/^("""|```)(.*)\n((.*\n)*?)\1/gm,function(n,e,r,t){return'"""'===e?l("div",p(t,u),{class:r}):u&&u.preCode?l("pre",l("code",a(t),{class:r})):l("pre",a(t),{class:r})},/(^>.*\n?)+/gm,e("blockquote",/^> ?(.*)$/gm,"$1",r),/((^|\n)\|.+)+/g,e("table",/^.*(\n\|---.*?)?$/gm,function(n,t){return e("tr",/\|(-?)([^|]*)\1(\|$)?/gm,function(n,e,r){return l(e||t?"th":"td",g(r))})(n.slice(0,n.length-(t||"").length))}),o,c,/#\[([^\]]+?)]/g,'<a name="$1"></a>',/^(#+) +(.*)(?:$)/gm,function(n,e,r){return l("h"+e.length,g(r))},/^(===+|---+)(?=\s*$)/gm,"<hr>"],p,u)}var i=this,a=function(n){return n?n.replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""},o=/(?:(^|\n)([+-]|\d+\.) +(.*(\n[ \t]+.*)*))+/g,g=function c(n,i){var o=[];return n=(n||"").trim().replace(/`([^`]*)`/g,function(n,e){return"\\"+o.push(l("code",a(e)))}).replace(/[!&]?\[([!&]?\[.*?\)|[^\]]*?)]\((.*?)( .*?)?\)|(\w+:\/\/[$\-.+!*'()/,\w]+)/g,function(n,e,r,t,u){return u?i?n:"\\"+o.push(l("a",u,{href:u})):"&"==n[0]?(e=e.match(/^(.+),(.+),([^ \]]+)( ?.+?)?$/),"\\"+o.push(l("iframe","",{width:e[1],height:e[2],frameborder:e[3],class:e[4],src:r,title:t}))):"\\"+o.push("!"==n[0]?l("img","",{src:r,alt:e,title:t}):l("a",c(e,1),{href:r,title:t}))}),n=function r(n){return n.replace(/\\(\d+)/g,function(n,e){return r(o[Number.parseInt(e)-1])})}(i?n:r(n))},r=function t(n){return f(n,[/([*_]{1,3})((.|\n)+?)\1/g,function(n,e,r){return e=e.length,r=t(r),1<e&&(r=l("strong",r)),e%2&&(r=l("em",r)),r},/(~{1,3})((.|\n)+?)\1/g,function(n,e,r){return l([,"u","s","del"][e.length],t(r))},/  \n|\n  /g,"<br>"],t)},f=function(n,e,r,t){for(var u,c=0;c<e.length;){if(u=e[c++].exec(n))return r(n.slice(0,u.index),t)+("string"==typeof e[c]?e[c].replace(/\$(\d)/g,function(n,e){return u[e]}):e[c].apply(i,u))+r(n.slice(u.index+u[0].length),t);c++}return n},p=function(n,e){n=n.replace(/[\r\v\b\f]/g,"").replace(/\\./g,function(n){return"&#"+n.charCodeAt(1)+";"});var r=t(n,e);return r!==n||r.match(/^[\s\n]*$/i)||(r=g(r).replace(/((.|\n)+?)(\n\n+|$)/g,function(n,e){return l("p",e)})),r.replace(/&#(\d+);/g,function(n,e){return String.fromCharCode(parseInt(e))})};return{parse:p,block:t,inline:r,inlineBlock:g}}();

	const PREVIEW_TYPES = /^image\/(png|webp|svg|jpeg|jpg|gif|png)|^application\/pdf|^text\/|^audio\/|^video\//;

	const common_buttons = `<input class="rename" type="button" value="Rename" />
		<input class="delete" type="button" value="Delete" />`;

	const edit_button = `<input class="edit" type="button" value="Edit" />`;

	const mkdir_dialog = `<input type="text" name="mkdir" placeholder="Directory name" />`;
	const mkfile_dialog = `<input type="text" name="mkfile" placeholder="File name" />`;
	const rename_dialog = `<input type="text" name="rename" placeholder="New file name" />`;
	const paste_upload_dialog = `<h3>Upload this file?</h3><input type="text" name="paste_name" placeholder="New file name" />`;
	const edit_dialog = `<textarea name="edit" cols="70" rows="30"></textarea>`;
	const markdown_dialog = `<div id="mdp"><textarea name="edit" cols="70" rows="30"></textarea><div id="md"></div></div>`;
	const delete_dialog = `<h3>Confirm delete ?</h3>`;

	const dialog_tpl = `<dialog open><p class="close"><input type="button" value="&#x2716; Close" class="close" /></p><form><div>%s</div>%b</form></dialog>`;

	const html_tpl = `<!DOCTYPE html><html>
		<head><title>Files</title><link rel="stylesheet" type="text/css" href="${css_url}" /></head>
		<body><main></main><div class="bg"></div></body></html>`;

	const body_tpl = `<h1>%title%</h1>
		<div class="upload">
			<input class="mkdir" type="button" value="New directory" />
			<input type="file" style="display: none;" />
			<input class="mkfile" type="button" value="New text file" />
			<input class="uploadfile" type="button" value="Upload file" />
		</div>
		<table>%table%</table>`;

	const dir_row_tpl = `<tr><td class="thumb"><span class="icon dir"><b>%icon%</b></span></td><th colspan="3"><a href="%uri%">%name%</a></th><td class="buttons"><div></div></td></tr>`;
	const file_row_tpl = `<tr data-mime="%mime%"><td class="thumb"><span class="icon %icon%"><b>%icon%</b></span></td><th><a href="%uri%">%name%</a></th><td class="size">%size%</td><td>%modified%</td><td class="buttons"><div><a href="%uri%" download class="btn">Download</a></div></td></tr>`;

	const propfind_tpl = `<?xml version="1.0" encoding="UTF-8"?>
		<D:propfind xmlns:D="DAV:">
			<D:prop>
				<D:getlastmodified/><D:getcontenttype/><D:getcontentlength/><D:resourcetype/><D:displayname/>
			</D:prop>
		</D:propfind>`;

	const html = (unsafe) => {
		return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	};

	const reqXML = (method, url, body, headers) => {
		return req(method, url, body, headers).then((r) => {
				if (!r.ok) {
					throw new Error("error");
				}
				return r.text();
			}).then(str => new window.DOMParser().parseFromString(str, "text/xml"));
	};

	const reqAndReload = (method, url, body, headers) => {
		animateLoading();
		req(method, url, body, headers).then(r => {
			stopLoading();
			if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
			reloadListing();
		}).catch(e => {
			console.log(e);
			alert(e);
		});
		return false;
	};

	const get_url = async (url) => {
		if (temp_object_url) {
			window.URL.revokeObjectURL(temp_object_url);
		}

		return req('GET', url).then(r => r.blob()).then(blob => {
			temp_object_url = window.URL.createObjectURL(blob);
			return temp_object_url;
		});
	}

	const req = (method, url, body, headers) => {
		if (!headers) {
			headers = {};
		}

		if (auth_header) {
			headers.Authorization = auth_header;
		}

		return fetch(url, {method, body, headers});
	};

	const template = (tpl, params) => {
		return tpl.replace(/%(\w+)%/g, (a, b) => {
			return params[b];
		});
	};

	const openDialog = (html, ok_btn = true) => {
		var tpl = dialog_tpl.replace(/%b/, ok_btn ? '<p><input type="submit" value="OK" /></p>' : '');
		$('body').classList.add('dialog');
		$('body').insertAdjacentHTML('beforeend', tpl.replace(/%s/, html));
		$('.close input').onclick = closeDialog;
		evt = window.addEventListener('keyup', (e) => {
			if (e.key != 'Escape') return;
			closeDialog();
			return false;
		});
		if (a = $('dialog form input, dialog form textarea')) a.focus();
	};

	const closeDialog = (e) => {
		$('body').classList.remove('dialog');
		if (!$('dialog')) return;
		$('dialog').remove();
		window.removeEventListener('keyup', evt);
		evt = null;
	};

	const download = async (name, url) => {
		var url = await get_url(url);
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		a.remove();
	};

	const preview = (type, url) => {
		if (type.match(/^image\//)) {
			openDialog(`<img src="${url}" />`, false);
		}
		else if (type.match(/^audio\//)) {
			openDialog(`<audio controls="true" autoplay="true" src="${url}" />`, false);
		}
		else if (type.match(/^video\//)) {
			openDialog(`<video controls="true" autoplay="true" src="${url}" />`, false);
		}
		else {
			openDialog(`<iframe src="${url}" />`, false);
		}

		$('dialog').className = 'preview';
	};

	const $ = (a) => document.querySelector(a);

	const formatBytes = (bytes, unit) => {
		if (!unit) {
			unit = 'B';
		}

		if (bytes >= 1024*1024*1024) {
			return Math.round(bytes / (1024*1024*1024)) + ' G' + unit;
		}
		else if (bytes >= 1024*1024) {
			return Math.round(bytes / (1024*1024)) + ' M' + unit;
		}
		else if (bytes >= 1024) {
			return Math.round(bytes / 1024) + ' K' + unit;
		}
		else {
			return bytes + '  ' + unit;
		}
	};

	const formatDate = (date) => {
		var now = new Date;
		var nb_hours = (+(now) - +(date)) / 3600 / 1000;

		if (date.getFullYear() == now.getFullYear() && date.getMonth() == now.getMonth() && date.getDate() == now.getDate()) {
			if (nb_hours <= 1) {
				return '%d minutes ago'.replace(/%d/, Math.round(nb_hours * 60));
			}
			else {
				return '%d hours ago'.replace(/%d/, Math.round(nb_hours));
			}
		}
		else if (nb_hours <= 24) {
			return 'Yesterday, %s'.replace(/%s/, date.toLocaleTimeString());
		}

		return date.toLocaleString();
	};

	const openListing = (uri, push) => {
		closeDialog();

		reqXML('PROPFIND', uri, propfind_tpl, {'Depth': 1}).then((xml) => {
			buildListing(uri, xml)
			current_url = uri;
			changeURL(uri, push);
		}).catch((e) => {
			console.error(e);
			alert(e);
		});
	};

	const reloadListing = () => {
		stopLoading();
		openListing(current_url, false);
	};

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
				openListing(url, false);
			});
		}
		catch (e) {
			// If using a HTML page on another origin
			location.hash = uri;
		}
	};

	const animateLoading = () => {
		document.body.classList.add('loading');
	};

	const stopLoading = () => {
		document.body.classList.remove('loading');
	};

	const buildListing = (uri, xml) => {
		uri = normalizeURL(uri);

		var items = [[], []];
		var title = null;

		xml.querySelectorAll('response').forEach((node) => {
			var item_uri = normalizeURL(node.querySelector('href').textContent);
			var name = item_uri.replace(/\/$/, '').split('/').pop();
			name = decodeURIComponent(name);

			if (item_uri == uri) {
				title = name;
				return;
			}

			var is_dir = node.querySelector('resourcetype collection') ? true : false;

			items[is_dir ? 0 : 1].push({
				'uri': item_uri,
				'name': name,
				'size': !is_dir ? parseInt(node.querySelector('getcontentlength').textContent, 10) : null,
				'mime': !is_dir ? node.querySelector('getcontenttype').textContent : null,
				'modified': new Date(node.querySelector('getlastmodified').textContent),
				'is_dir': is_dir,
			});
		});

		items[0].sort((a, b) => a.name.localeCompare(b.name));
		items[1].sort((a, b) => a.name.localeCompare(b.name));

		// Sort with directories first
		items = items[0].concat(items[1]);

		var table = '';
		var parent = uri.replace(/\/+$/, '').split('/').slice(0, -1).join('/') + '/';

		if (parent.length >= base_url.length) {
			table += template(dir_row_tpl, {'name': 'Back', 'uri': parent, 'icon': '&#x21B2;'});
		}
		else {
			title = 'My files';
		}

		items.forEach(item => {
			var row = item.is_dir ? dir_row_tpl : file_row_tpl;
			item.size = item.size !== null ? formatBytes(item.size).replace(/ /g, '&nbsp;') : null;
			item.icon = item.is_dir ? '&#x1F4C1;' : item.uri.replace(/^.*\.(\w+)$/, '$1').toUpperCase();
			item.modified = item.modified !== null ? formatDate(item.modified) : null;
			item.name = html(item.name);
			table += template(row, item);
		});

		document.title = title;
		document.querySelector('main').innerHTML = template(body_tpl, {'title': html(document.title), 'base_url': base_url, 'table': table});

		Array.from($('table').rows).forEach((tr) => {
			var $$ = (a) => tr.querySelector(a);
			var file_url = $$('a').href;
			var file_name = $$('a').innerText;
			var dir = $$('[colspan]');
			var type = !dir ? tr.getAttribute('data-mime') : 'dir';
			var buttons = $$('td.buttons div')

			if (dir) {
				$$('a').onclick = () => {
					openListing(file_url, true);
					return false;
				};
			}

			// For back link
			if (dir && $$('a').getAttribute('href').length < uri.length) {
				dir.setAttribute('colspan', 4);
				tr.querySelector('td:last-child').remove();
				return;
			}

			// This is to get around CORS when not on the same domain
			if (user && password && (a = tr.querySelector('a[download]'))) {
				a.onclick = () => {
					download(url);
					return false;
				};
			}

			// Add rename/delete buttons
			buttons.insertAdjacentHTML('afterbegin', common_buttons);

			if (type.match(PREVIEW_TYPES)) {
				$$('a').onclick = () => {
					if (file_url.match(/\.md$/)) {
						openDialog('<div class="md_preview"></div>', false);
						$('dialog').className = 'preview';
						req('GET', file_url).then(r => r.text()).then(t => {
							$('.md_preview').innerHTML = microdown.parse(html(t));
						});
						return false;
					}

					if (user && password) {
						(async () => { preview(type, await get_url(file_url)); })();
					}
					else {
						preview(type, file_url);
					}

					return false;
				};
			}
			else if (user && password && !dir) {
				$$('a').onclick = () => { download(file_name, file_url); return false; };
			}

			if (type.match(/^text\/|application\/x-empty/)) {
				buttons.insertAdjacentHTML('beforeend', edit_button);

				$$('.edit').onclick = (e) => {
					req('GET', file_url).then((r) => r.text().then((t) => {
						let md = file_url.match(/\.md$/);
						openDialog(md ? markdown_dialog : edit_dialog);
						var txt = $('textarea[name=edit]');
						txt.value = t;

						// Markdown editor
						if (md) {
							let pre = $('#md');

							txt.oninput = () => {
								pre.innerHTML = microdown.parse(html(txt.value));
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

							return reqAndReload('PUT', file_url, content);
						};
					}));
				};
			}

			$$('.delete').onclick = (e) => {
				openDialog(delete_dialog);
				document.forms[0].onsubmit = () => {
					return reqAndReload('DELETE', file_url);
				};
			};

			$$('.rename').onclick = () => {
				openDialog(rename_dialog);
				let t = $('input[name=rename]');
				t.value = file_name;
				t.focus();
				t.selectionStart = 0;
				t.selectionEnd = file_name.lastIndexOf('.');
				document.forms[0].onsubmit = () => {
					var name = t.value;

					if (!name) return false;

					name = encodeURIComponent(name);
					name = name.replace(/%2F/, '/');

					var dest = file_url.replace(/\/+[^\/]*$/, '/') + name;
					dest = normalizeURL(dest);

					return reqAndReload('MOVE', file_url, '', {'Destination': dest});
				};
			};

		});

		$('.mkdir').onclick = () => {
			openDialog(mkdir_dialog);
			document.forms[0].onsubmit = () => {
				var name = $('input[name=mkdir]').value;

				if (!name) return false;

				name = encodeURIComponent(name);

				req('MKCOL', current_url + name).then(() => openListing(current_url + name + '/'));
				return false;
			};
		};

		$('.mkfile').onclick = () => {
			openDialog(mkfile_dialog);
			var t = $('input[name=mkfile]');
			t.value = '.md';
			t.focus();
			t.selectionStart = t.selectionEnd = 0;
			document.forms[0].onsubmit = () => {
				var name = t.value;

				if (!name) return false;

				name = encodeURIComponent(name);

				return reqAndReload('PUT', current_url + name, '');
			};
		};

		var fi = $('input[type=file]');

		$('.uploadfile').onclick = () => fi.click();

		fi.onchange = () => {
			if (!fi.files.length) return;

			var body = new Blob(fi.files);
			var name = fi.files[0].name;

			name = encodeURIComponent(name);

			return reqAndReload('PUT', current_url + name, body);
		};
	};

	var current_url = url;
	var base_url = url;
	var auth_header = (user && password) ? 'Basic ' + btoa(user + ':' + password) : null;

	if (!base_url.match(/^https?:/)) {
		base_url = location.href.replace(/^(https?:\/\/[^\/]+\/).*$/, '$1') + base_url.replace(/^\/+/, '');
	}

	var evt, paste_upload, popstate_evt, temp_object_url;

	document.querySelector('html').innerHTML = html_tpl;

	reloadListing();

	window.addEventListener('paste', (e) => {
		let items = e.clipboardData.items;
		const IMAGE_MIME_REGEX = /^image\/(p?jpeg|gif|png)$/i;

		for (var i = 0; i < items.length; i++) {
			if (items[i].kind === 'file' || IMAGE_MIME_REGEX.test(items[i].type)) {
				e.preventDefault();
				let f = items[i].getAsFile();
				let name = f.name == 'image.png' ? f.name.replace(/\./, '-' + (+(new Date)) + '.') : f.name;

				paste_upload = f;

				openDialog(paste_upload_dialog);

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

		let items = e.dataTransfer.items;

		if (!items.length) return;

		animateLoading();

		(async () => {
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				if (item.kind != 'file') return;
				var f = item.getAsFile();
				await req('PUT', current_url + encodeURIComponent(f.name), f);
			}

			stopLoading();
			reloadListing();
		})();
	});
};

if (url = document.querySelector('html').getAttribute('data-webdav-url')) {
	WebDAVNavigator(url);
}
