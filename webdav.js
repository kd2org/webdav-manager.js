var js = {};
js.root = document.currentScript.src.replace(/\/[^\/]+$/, '/');
js.loaded = {};
js.load = (url, css) => {
	if (url.substr(0, 2) === './') {
		url = js.root + url.substr(2);
	}

	if (css && css.substr(0, 2) === './') {
		css = js.root + css.substr(2);
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

(async function() {
	await js.load('./lib/browser.js', './webdav.css');
	await js.load('./lib/css.js');
	await js.load('./lib/dav.js');
	await js.load('./lib/editor.js');
	await js.load('./lib/markdowntohtml.js');
	await js.load('./lib/utils.js');
	await js.load('./lib/wopi.js');
	await js.load('./lib/zipwriter.js');
	await js.load('./vendor/prism_editor.js', './vendor/prism_editor.css');
})();
