'use strict';
'require baseclass';
'require rpc';
'require uci';

const callGetStatuses = rpc.declare({
	object: 'luci.sfp-status',
	method: 'getStatuses',
	params: [ 'interface' ],
	expect: {}
});

let lastSuccessfulReply = null;

function valueOrDash(value) {
	if (value == null)
		return '-';

	const stringValue = String(value).trim();
	return stringValue !== '' ? stringValue : '-';
}

function normalizeContent(content) {
	return Array.isArray(content) ? content : [ content ];
}

function renderFieldRow(label, content, isLast) {
	return E('div', {
		'class': isLast ? 'cbi-value cbi-value-last' : 'cbi-value'
	}, [
		E('label', { 'class': 'cbi-value-title' }, normalizeContent(label)),
		E('div', { 'class': 'cbi-value-field' }, normalizeContent(content))
	]);
}

function buildCard(fields, status, options) {
	const rows = [];
	const header = options && options.header;

	if (header)
		rows.push(renderFieldRow(header.label, header.value, fields.length === 0));

	for (let index = 0; index < fields.length; index++) {
		const field = fields[index];
		const content = field.render ? field.render(status) : valueOrDash(status?.[field.key]);
		const isLast = index === fields.length - 1;

		rows.push(renderFieldRow(field.label, content, isLast));
	}

	return E('div', { 'class': 'cbi-section-node' }, rows);
}

function renderInterfaceBadge(value) {
	return E('span', { 'class': 'ifacebadge' }, [ valueOrDash(value) ]);
}

function renderUnavailable(status) {
	return buildCard([
		{ label: _('Status'), render: function() { return valueOrDash(status?.error || _('Unavailable')); } },
		{ label: _('Interface'), render: function() { return renderInterfaceBadge(status?.interface); } },
		{ label: _('Available Interfaces'), render: function() {
			const interfaces = Array.isArray(status?.interfaces) ? status.interfaces : [];
			return interfaces.length ? interfaces.join(', ') : '-';
		} }
	], status || {});
}

function renderModuleOverview(status, sampledAt) {
	if (!status || status.supported === false)
		return renderUnavailable(status);

	return buildCard([
		{ label: 'SFP型号', key: 'module_name' },
		{ label: _('Temperature'), key: 'temperature' },
		{ label: 'SFP速度', key: 'speed' },
		{ label: _('Voltage'), key: 'voltage' },
		{ label: _('Bias Current'), key: 'bias_current' },
		{ label: 'RX Power', key: 'rx_power' },
		{ label: 'TX Power', key: 'tx_power' }
	], status, {
		header: {
			label: _('Module'),
			value: sampledAt ? [
				renderInterfaceBadge(status.module_slot || status.interface),
				E('div', { 'class': 'cbi-value-description' }, [ '采样时间: ' + valueOrDash(sampledAt) ])
			] : renderInterfaceBadge(status.module_slot || status.interface)
		}
	});
}

function renderMergedOverview(modules, sampledAt) {
	return E('div', {
		'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1rem;align-items:start;'
	}, modules.map(function(module) {
		return E('div', {}, [ renderModuleOverview(module, sampledAt) ]);
	}));
}

function renderOverview(reply) {
	const modules = Array.isArray(reply?.modules) ? reply.modules : [];

	if (!modules.length)
		return renderUnavailable(reply);

	if (modules.length === 1)
		return renderModuleOverview(modules[0], reply?.sampled_at);

	return renderMergedOverview(modules, reply?.sampled_at);
}

function loadStatuses(interfaceName, timeoutMs) {
	const fallback = {
		supported: false,
		interfaces: [],
		modules: [],
		interface: interfaceName || '',
		error: _('Unavailable')
	};

	return new Promise(function(resolve) {
		let settled = false;
		const timer = window.setTimeout(function() {
			if (settled)
				return;

			settled = true;
			resolve(lastSuccessfulReply || fallback);
		}, timeoutMs > 0 ? timeoutMs : 6000);

		Promise.resolve(callGetStatuses(interfaceName)).then(function(status) {
			if (settled)
				return;

			settled = true;
			window.clearTimeout(timer);

			if (Array.isArray(status?.modules) && status.modules.length)
				lastSuccessfulReply = status;

			resolve(status || fallback);
		}).catch(function() {
			if (settled)
				return;

			settled = true;
			window.clearTimeout(timer);
			resolve(lastSuccessfulReply || fallback);
		});
	});
}

return baseclass.extend({
	title: _('SFP'),

	load() {
		return Promise.all([
			L.resolveDefault(uci.load('sfp-status'), null),
			L.resolveDefault(loadStatuses(''), {})
		]);
	},

	render(data) {
		const enabled = uci.get('sfp-status', 'settings', 'overview_enabled');

		if (enabled === '0')
			return null;

		return renderOverview(data ? data[1] : null);
	}
});