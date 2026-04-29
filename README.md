# luci-app-sfp-status

适用于 OpenWrt 24.10 的 LuCI 应用，用于读取 SFP DOM 遥测信息，并在以下两个位置展示：

- 状态 > 概览：通过原生概览页组件展示。
- 状态 > SFP：通过带设置项的独立实时详情页展示。

## 主题兼容性

该组件和页面使用标准 LuCI 结构类，例如 cbi-section、table、tr、td 和 ifacebadge，因此能够遵循当前 LuCI 的布局模型，并在无需页面专用 CSS 覆盖的前提下良好适配 luci-theme-argon。

## 数据来源

后端通过 ethtool 读取 SFP 信息：

- ethtool -m &lt;ifname&gt;：读取 DOM 遥测和模块信息。
- ethtool &lt;ifname&gt;：读取链路状态和速率信息。

如果未配置接口，后端会自动探测第一个可读取 SFP DOM 数据的网络设备。

## 文件说明

- root/usr/libexec/rpcd/luci.sfp-status：rpcd 后端，提供 luci.sfp-status 的 ubus 方法。
- htdocs/luci-static/resources/view/status/include/15_sfp.js：概览页组件。
- htdocs/luci-static/resources/view/sfp-status/overview.js：独立状态页。
- root/usr/share/rpcd/acl.d/luci-app-sfp-status.json：LuCI ACL 权限定义。
- root/usr/share/luci/menu.d/luci-app-sfp-status.json：菜单入口。

## 构建

将该软件包目录放入 LuCI feed，或放到 feeds/luci/applications/ 目录下，然后按常规 OpenWrt 流程进行构建：

```sh
make menuconfig
make package/luci-app-sfp-status/compile V=s
```

## 运行验证

安装生成的 ipk 后，执行：

```sh
opkg install luci-app-sfp-status_0.1.0-1_all.ipk
ubus -v list luci.sfp-status
ubus call luci.sfp-status getInterfaces
ubus call luci.sfp-status getStatus '{}'
```

随后打开 LuCI：

- 进入 状态 > SFP，确认实时表格能够正常刷新。
- 进入 状态 > 概览，确认 SFP 卡片可见，并且在 luci-theme-argon 下样式显示正常。
