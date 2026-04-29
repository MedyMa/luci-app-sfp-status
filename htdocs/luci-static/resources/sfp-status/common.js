'use strict';
'require rpc';
'require baseclass';

const callGetInterfaces = rpc.declare({
	object: 'luci.sfp-status',
	method: 'getInterfaces',
	expect: { interfaces: [] }
});

const callGetStatus = rpc.declare({
	object: 'luci.sfp-status',
	method: 'getStatus',
	params: [ 'interface' ],
	expect: {}
});

function loadStatus(interfaceName, timeoutMs) {
	const fallback = {
		supported: false,
		interface: interfaceName || '',
		error: _('Unavailable')
	};

	return new Promise(function(resolve) {
		let settled = false;
		const timer = window.setTimeout(function() {
			if (settled)
				return;

			settled = true;
			resolve(fallback);
		}, timeoutMs > 0 ? timeoutMs : 1500);

		Promise.resolve(callGetStatus(interfaceName)).then(function(status) {
			if (settled)
				return;

			settled = true;
			window.clearTimeout(timer);
			resolve(status || fallback);
		}).catch(function() {
			if (settled)
				return;

			settled = true;
			window.clearTimeout(timer);
			resolve(fallback);
		});
	});
}

function valueOrDash(value) {
	if (value == null)
		return '-';

	const stringValue = String(value).trim();
	return stringValue !== '' ? stringValue : '-';
}

function renderInterfaceBadge(value) {
	return E('span', { 'class': 'ifacebadge' }, [ valueOrDash(value) ]);
}

function renderLinkValue(status) {
	if (status == null || status.link_up == null)
		return '-';

	return E('span', { 'class': 'ifacebadge' }, [ status.link_up ? _('Up') : _('Down') ]);
}

function renderBoolean(value) {
	return value ? _('Yes') : _('No');
}

function normalizeContent(content) {
	return Array.isArray(content) ? content : [ content ];
}

function buildTable(fields, status, options) {
	const table = E('table', { 'class': 'table' });
	const header = options && options.header;

	if (header) {
		table.appendChild(E('tr', { 'class': 'tr table-titles' }, [
			E('th', { 'class': 'th left', 'width': '33%' }, normalizeContent(header.label)),
			E('th', { 'class': 'th left' }, normalizeContent(header.value))
		]));
	}

	for (let i = 0; i < fields.length; i++) {
		const field = fields[i];
		const content = field.render ? field.render(status) : valueOrDash(status?.[field.key]);
		const rowClass = field.rowClass ? field.rowClass(status) : null;

		table.appendChild(E('tr', { 'class': rowClass ? 'tr ' + rowClass : 'tr' }, [
			E('td', {
				'class': 'td left',
				'width': '33%',
				'data-title': field.dataTitle || _('Name')
			}, [ field.label ]),
			E('td', {
				'class': 'td left',
				'data-title': field.valueTitle || _('Value')
			}, normalizeContent(content))
		]));
	}

	return table;
}

function renderUnavailable(status) {
	const fields = [
		{ label: _('Status'), render: function() { return valueOrDash(status?.error || _('Unavailable')); } },
		{ label: _('Configured Interface'), render: function() { return renderInterfaceBadge(status?.configured_interface); } },
		{ label: _('Interface'), render: function() { return renderInterfaceBadge(status?.interface); } },
		{ label: _('Available Interfaces'), render: function() {
			const interfaces = Array.isArray(status?.interfaces) ? status.interfaces : [];
			return interfaces.length ? interfaces.join(', ') : '-';
		} }
	];

	return buildTable(fields, status || {});
}

function renderOverview(status) {
	if (!status || status.supported === false)
		return renderUnavailable(status);

	return buildTable([
		{ label: _('SFP Name'), key: 'module_name' },
		{ label: _('Temperature'), key: 'temperature' },
		{ label: _('SFP Speed'), key: 'speed' },
		{ label: _('Voltage'), key: 'voltage' },
		{ label: _('Bias Current'), key: 'bias_current' },
		{ label: _('RX Power'), key: 'rx_power' },
		{ label: _('TX Power'), key: 'tx_power' }
	], status, {
		header: {
			label: _('Module'),
			value: valueOrDash(status.module_slot || status.interface)
		}
	});
}

function renderDetails(status) {
	if (!status || status.supported === false)
		return renderUnavailable(status);

	return buildTable([
		{ label: _('Interface'), render: function() { return renderInterfaceBadge(status.interface); } },
		{ label: _('Configured Interface'), render: function() { return renderInterfaceBadge(status.configured_interface); } },
		{ label: _('Auto-detected'), render: function() { return renderBoolean(status.auto_detected); } },
		{ label: _('Link'), render: function() { return renderLinkValue(status); } },
		{ label: _('Module'), key: 'module_name' },
		{ label: _('Identifier'), key: 'identifier' },
		{ label: _('Vendor'), key: 'vendor_name' },
		{ label: _('Part Number'), key: 'vendor_part' },
		{ label: _('Revision'), key: 'vendor_revision' },
		{ label: _('Serial Number'), key: 'serial' },
		{ label: _('Wavelength'), key: 'wavelength' },
		{ label: _('Temperature'), key: 'temperature' },
		{ label: _('Voltage'), key: 'voltage' },
		{ label: _('Bias Current'), key: 'bias_current' },
		{ label: _('RX Power'), key: 'rx_power' },
		{ label: _('TX Power'), key: 'tx_power' },
		{ label: _('SFP Speed'), key: 'speed' },
		{ label: _('Duplex'), key: 'duplex' },
		{ label: _('Port'), key: 'port' },
		{ label: _('Data Source'), key: 'source' }
	], status);
}

return baseclass.extend({
	__name__: 'sfp-status.common',
	callGetInterfaces: callGetInterfaces,
	callGetStatus: callGetStatus,
	loadStatus: loadStatus,
	renderOverview: renderOverview,
	renderDetails: renderDetails
});