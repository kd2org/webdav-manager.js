var css = {};
css.all = (selector) => document.querySelectorAll(selector);
css.hide = (selector) => css.all(selector).forEach(e => e.style.display = 'none');
css.show = (selector) => css.all(selector).forEach(e => e.style.display = null);
css.toggle = (selector, show) => show ? css.show(selector) : css.hide(selector);
css.onclick = (selector, callback) => css.all(selector).forEach(el => el.onclick = (ev) => callback(ev, el));
css.isVisible = (elm) => {
	var rect = elm.getBoundingClientRect();
	var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
	return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
};
