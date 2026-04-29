# This is free software, licensed under the Apache License, Version 2.0.

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-sfp-status
PKG_VERSION:=0.1.1
PKG_RELEASE:=2
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=GitHub Copilot

LUCI_TITLE:=LuCI SFP status monitor
LUCI_DESCRIPTION:=Overview and detailed DOM status for SFP modules
LUCI_DEPENDS:=+luci-base +ethtool
LUCI_PKGARCH:=all

define Package/$(PKG_NAME)/conffiles
/etc/config/sfp-status
endef

define Build/Prepare/$(PKG_NAME)
	chmod 0755 $(PKG_BUILD_DIR)/root/etc/uci-defaults/40_luci-sfp-status
	chmod 0755 $(PKG_BUILD_DIR)/root/usr/libexec/rpcd/luci.sfp-status
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$$IPKG_INSTROOT" ] || /etc/uci-defaults/40_luci-sfp-status
exit 0
endef

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
