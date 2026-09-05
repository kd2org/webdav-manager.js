function markdownToHTML(text) {
	text = text.replace(/\r\n|\r/g, "\n");
	text = utils.html(text);

	var lines = text.split("\n");
	var out = '';
	var in_code = false;
	var in_quote = false;
	var in_table = false;
	var ul_length = null;
	var ul_level = 0;
	var ol = false;

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trimEnd();

		if (line.match(/^\s*```\w*\s*/)) {
			if (in_code) {
				out += '</code></pre>';
				in_code = false;
			}
			else {
				out += '<pre><code>';
				in_code = true;
			}
			continue;
		}
		else if (in_code) {
			out += line + "\n";
			continue;
		}
		else if (line.match(/^\|[\|\s-:]+\|$/)) {
			// Ignore table separator
			continue;
		}
		else if (line.match(/^\|/)) {
			line = line.replace(/^\||\|$/g, '');
			line = line.replace(/\|/g, '</td><td>');

			if (!in_table) {
				out += '<table>';
				in_table = true;
			}

			out += '<tr><td>' + line + '</td></tr>';
			continue;
		}
		else if (in_table) {
			out += '</table>';
			in_table = false;
			continue;
		}
		else if (match = line.match(/^#+/)) {
			var l = match[0].length;
			out += '<h' + l + '>' + line.substr(l).trim() + '</h' + l + '>';
			continue;
		}
		else if (line.match(/^(?:---+|\*{3,}|___+)$/)
			&& (i === 0 || !lines[i-1].trim().length)) {
			out += '<hr />';
			continue;
		}
		else if (match = line.match(/^(&gt;\s*)+/)) {
			line = line.substr(match[0].length).trim();

			if (!in_quote) {
				out += '<blockquote>';
				in_quote = true;
			}
		}
		else if (in_quote) {
			out += '</blockquote>';
			in_quote = false;
		}

		if (match = line.match(/^(\s*)[*-]\s+/)) {
			var length = match[1].length;

			if (ul_level === 0 || length > ul_length) {
				out += '<ul><li>';
				ul_length = length;
				ul_level++;
			}
			else if (length < ul_length) {
				out += '</li></ul><li>';
				ul_length = length;
				ul_level--;
			}
			else {
				out += '</li>';
				out += '<li>';
			}

			line = line.substr(match[0].length).trim();
		}
		else if (ul_level) {
			while (ul_level) {
				out += '</ul>';
				ul_level--;
			}

			ul_length = null;

			if (line === '') {
				continue;
			}
		}
		else if (match = line.match(/^\d+\.\s+/)) {
			if (!ol) {
				out += '<ol>';
				ol = true;
			}

			line = line.substr(match[0].length).trim();
			out += '<li>';
		}
		else if (ol) {
			out += '</ol>';
			ol = false;

			if (line === '') {
				continue;
			}
		}

		if (line === '') {
			out += '<p>';
		}
		else {
			line = line.replace(/!\[(.*?)\]\((.+?)\)/g, (_, alt, url) => '<img src="' + url + '" alt="' + alt + '" />');
			line = line.replace(/\[(.*?)\]\((.+?)\)/g, (_, l, h) => '<a href="' + h + '">' + (l || h) + '</a>');
			line = line.replace(/&lt;(https?:\/\/.+?)&gt;/g, (_, url) => '<a href="' + url + '">' + url + '</a>');
			line = line.replace(/(?<=^|\s)(https?:\/\/.+?)(?=$|\s)/gm, (_, url) => '<a href="' + url + '">' + url + '</a>');
			line = line.replace(/\*{3}(.+?)\*{3}/g, (_, text) => '<strong><em>' + text + '</em></strong>');
			line = line.replace(/\*{2}(.+?)\*{2}/g, (_, text) => '<strong>' + text + '</strong>');
			line = line.replace(/\*{1}(.+?)\*{1}/g, (_, text) => '<em>' + text + '</em>');
			line = line.replace(/==(\b.+?\b)==/g, (_, text) => '<mark>' + text + '</mark>');
			line = line.replace(/~~(\b.+?\b)~~/g, (_, text) => '<s>' + text + '</s>');
			line = line.replace(/`(\b.+?\b)`/g, (_, text) => '<code>' + text + '</code>');
			line = line.replace(/\[ +\](?=\s|$)/gm, '<span class="unchecked">☐</span>');
			line = line.replace(/\[x\](?=\s|$)/gmi, '<span class="checked">☑</span>');
			out += line;
		}

		if (!ol && !ul_level && line !== '') {
			out += "<br />";
		}
	}

	return out;
}
