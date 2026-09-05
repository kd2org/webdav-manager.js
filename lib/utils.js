var utils = {};

utils.formatBytes = (bytes) => {
	const unit = _('B');

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

utils.formatDate = (date) => {
	if (isNaN(date)) {
		return '';
	}

	var now = new Date;
	var nb_hours = (+(now) - +(date)) / 3600 / 1000;

	if (date.getFullYear() == now.getFullYear() && date.getMonth() == now.getMonth() && date.getDate() == now.getDate()) {
		if (nb_hours <= 1) {
			return _('%d minutes ago').replace(/%d/, Math.round(nb_hours * 60));
		}
		else {
			return _('%d hours ago').replace(/%d/, Math.round(nb_hours));
		}
	}
	else if (nb_hours <= 24) {
		return _('Yesterday, %s').replace(/%s/, date.toLocaleTimeString());
	}

	return date.toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric'});
};
