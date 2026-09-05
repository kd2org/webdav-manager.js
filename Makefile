PHONY:

webdav-mini.js: lib/%.js init.js webdav.css
	echo -n 'var css = `' > webdav-mini.js
	cat webdav.css | sed -E 's/^\s+//g' | tr -d '\n' >> webdav-mini.js
	echo '`; var s = document.createElement("style"); s.innerText = css; document.head.appendChild(s);'; >> webdav-mini.js
	cat lib/*.js init.js >> webdav-mini.js
	esbuild --bundle --minify webdav-mini.js --outfile=webdav-mini.js --target=chrome99,firefox99,safari11,edge99 --allow-overwrite
