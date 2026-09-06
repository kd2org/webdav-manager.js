#PHONY:= browser.min.js

browser.min.js: lib/*.js style.css vendor/prism_editor.*
	echo -n 'var css = `' > mini.js
	cat style.css | sed -E 's/^\s+//g' | tr -d '\n' >> mini.js
	echo >> mini.js
	#cat vendor/prism_editor.css >> mini.js
	echo '`; var s = document.createElement("style"); s.type = "text/css"; s.setAttribute("webdav", "1");' >> mini.js
	echo "s.appendChild(document.createTextNode(css)); document.querySelector('head').appendChild(s);" >> mini.js
	for i in lib/*.js; do cat $$i >> mini.js; echo >> mini.js; done;
	#cat vendor/prism_editor.js >> mini.js
	minify mini.js -o browser.min.js
	#cat mini.js | sed -E 's/^\s+//g' > browser.js
	rm -f mini.js
