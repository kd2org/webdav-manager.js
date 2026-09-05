var editor = {};

editor.create = (input_name, file_name, text) => {
	if ('prismEditor' in window) {
		var e = document.createElement('div');
		const ed = prismEditor(e, {
			language: file_name.match(/\.md$/i) ? 'markdown' : 'text',
			value: text,
			wordwrap: true
		});
		ed.textarea.name = input_name;

		return ed.textarea;
	}

	var t = document.createElement('textarea');
	t.name = input_name;
	t.value = text;
	return t;
};
