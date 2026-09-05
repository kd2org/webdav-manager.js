#PHONY:

webdav-mini.js: lib/*.js init.js webdav.css
	echo -n 'var css = `' > webdav-mini.js
	cat webdav.css | sed -E 's/^\s+//g' | tr -d '\n' >> webdav-mini.js
	echo >> webdav-mini.js
	cat prism_editor.css >> webdav-mini.js
	echo '`; var s = document.createElement("style"); s.innerText = css; document.head.appendChild(s);'; >> webdav-mini.js
	cat lib/*.js init.js >> webdav-mini.js
	cat prism_editor.js >> webdav-mini.js
	minify webdav-mini.js -o webdav-mini.js
