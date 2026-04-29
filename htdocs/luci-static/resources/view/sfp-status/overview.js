'use strict';
'require view';
'require form';
'require uci';
'require poll';
'require dom';
'require sfp-status.common as sfp';

return view.extend({
	load() {
		return Promise.all([
			L.resolveDefault(uci.load('sfp-status'), null),
			L.resolveDefault(sfp.callGetInterfaces(), {}),
			L.resolveDefault(sfp.loadStatus(''), {})
		]);
	},

	async render(data) {
		const interfacesReply = data ? data[1] : {};
		const currentStatus = data ? data[2] : {};
		const interfaces = Array.isArray(interfacesReply.interfaces) ? interfacesReply.interfaces : [];

		const map = new form.Map('sfp-status', _('SFP Status'),
			_('Read DOM and runtime metrics from SFP modules and show them on LuCI overview.'));

		const statusContainer = E('div');
		const statusSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, [ _('Live SFP Details') ]),
			statusContainer,
			E('div', { 'class': 'cbi-map-descr' }, [
				_('The overview card uses LuCI status page polling cadence.')
			])
		]);

		let section, option;

		section = map.section(form.NamedSection, 'settings', 'settings', _('Settings'));
		section.anonymous = true;

		option = section.option(form.ListValue, 'interface', _('Interface'),
			_('Auto-detect will pick the first interface that supports DOM telemetry.'));
		option.value('', _('Auto-detect'));
		for (let i = 0; i < interfaces.length; i++)
			option.value(interfaces[i], interfaces[i]);

		option = section.option(form.Flag, 'overview_enabled', _('Overview Visibility'),
			_('Enable or disable the SFP widget on Status > Overview.'));
		option.default = '1';
		option.rmempty = false;

		dom.content(statusContainer, sfp.renderDetails(currentStatus));

		poll.add(function() {
			const configured = uci.get('sfp-status', 'settings', 'interface') || '';
			return L.resolveDefault(sfp.loadStatus(configured), {}).then(function(status) {
				dom.content(statusContainer, sfp.renderDetails(status));
			});
		}, 2);

		return E([], [
			statusSection,
			await map.render()
		]);
	}
});