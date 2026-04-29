'use strict';
'require baseclass';
'require uci';
'require sfp-status.common as sfp';

return baseclass.extend({
	title: _('SFP'),

	load() {
		return Promise.all([
			L.resolveDefault(uci.load('sfp-status'), null),
			L.resolveDefault(sfp.loadStatus(''), {})
		]);
	},

	render(data) {
		const enabled = uci.get('sfp-status', 'settings', 'overview_enabled');

		if (enabled === '0')
			return null;

		return sfp.renderOverview(data ? data[1] : null);
	}
});