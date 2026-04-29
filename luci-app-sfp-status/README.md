# luci-app-sfp-status

LuCI application for OpenWrt 24.10 that reads SFP DOM telemetry and renders it in two places:

- Status > Overview through a native overview include widget.
- Status > SFP through a dedicated live detail page with settings.

## Theme compatibility

The widget and page use standard LuCI structural classes such as `cbi-section`, `table`, `tr`, `td` and `ifacebadge` so they follow the current LuCI layout model and adapt cleanly to luci-theme-argon without page-specific CSS overrides.

## Data source

The backend reads SFP information from `ethtool`:

- `ethtool -m <ifname>` for DOM telemetry and inventory.
- `ethtool <ifname>` for link and speed details.

If no interface is configured, the backend auto-detects the first network device that exposes readable SFP DOM data.

## Files

- `root/usr/libexec/rpcd/luci.sfp-status`: rpcd backend exposing `luci.sfp-status` ubus methods.
- `htdocs/luci-static/resources/view/status/include/15_sfp.js`: overview widget.
- `htdocs/luci-static/resources/view/sfp-status/overview.js`: standalone page.
- `root/usr/share/rpcd/acl.d/luci-app-sfp-status.json`: LuCI ACL.
- `root/usr/share/luci/menu.d/luci-app-sfp-status.json`: menu entry.

## Build

Place the package directory in a LuCI feed or under `feeds/luci/applications/`, then build it with the usual OpenWrt workflow:

```sh
make menuconfig
make package/luci-app-sfp-status/compile V=s
```

## Runtime verification

After installing the generated ipk:

```sh
opkg install luci-app-sfp-status_0.1.0-1_all.ipk
ubus -v list luci.sfp-status
ubus call luci.sfp-status getInterfaces
ubus call luci.sfp-status getStatus '{}'
```

Then open LuCI:

- Go to Status > SFP and confirm the live table updates.
- Go to Status > Overview and confirm the SFP card is visible and styled correctly under luci-theme-argon.
