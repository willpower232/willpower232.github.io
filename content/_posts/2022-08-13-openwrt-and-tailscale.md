---
layout: post
title: OpenWrt and Tailscale
description:
category: computing
tags: linux
---

I am trying out [Tailscale](https://tailscale.com/) as a way of securely accessing computers and servers I use without learning the ins and outs of [WireGuard](https://www.wireguard.com/).

I also have a [GL-AR750S](https://www.gl-inet.com/products/gl-ar750s/) which I picked up as part of finding ways to improve wireless coverage in my house. This happens to run OpenWrt so should be able to do cool things on it.

I hasten to add that I don't really know what I'm doing and I still need to learn how Tailscale DNS works so I'll probably update this later.

Unfortunately logging in to LuCi and going to the page where you can add additional software doesn't offer Tailscale as an option and trying to use opkg (the package manager) via SSH doesn't help either.

The [opkg page for Tailscale](https://openwrt.org/packages/pkgdata/tailscale) suggests it can only be installed on OpenWrt 21 but it seems we're currently using OpenWrt 19 which is probably to blame.

This leaves us with two options, either we try and install manually or we update the device.

The most recent stock firmware seems to be OpenWrt 19 but thankfully [OpenWrt provides compatible firmware](https://openwrt.org/toh/gl.inet/gl-ar750s) with the updated version which is nice and you can upload it into LuCi although you'll lose the nice UI. Apparently this is the NOR and NAND version of the device so lets go with that.

Unfortunately that broke it which is mildly annoying but there is a NOR-only version we can try as well but how to do that whilst it is essentially bricked?

Powering the device whilst holding down the reset button and only having one ethernet cable connected puts it in U-boot mode where, with static IP address 192.168.1.2, you can upload the other firmware (to 192.168.1.1). Apparently if you break U-boot, you can also update that at 192.168.1.1/uboot.html which also might be necessary if the upload page has _two_ upload fields.

Unfortunately the NOR-only leaves you without the NAND bit and only 10MB of usable space so whilst usable, doesn't leave a lot of room for experimenting. There might be a way of mounting the NAND but I am definitely not knowledgeable enough for that.

Fortunately the stock firmware comes in U-boot version so getting back to stock is trouble free so we'll go for the manual install after all.

Meanwhile in SSH on your device, Tailscale [offers compiled downloads](https://pkgs.tailscale.com/stable/#static) but you may need to check your architecture with `uname -m`, I need the mips version. You can `wget` the correct download and then expand the tar file with `tar x -zvf` (that separate `x` was necessary for the busybox I had so whatever).

You can now verify it will work by trying to execute `tailscale version`, if it doesn't, you'll need to install some dependencies with opkg (probably ca-bundle and kmod-tun).

I stumbled upon [adyanth/openwrt-tailscale-enabler](https://github.com/adyanth/openwrt-tailscale-enabler) which provides a complete example but you might want to just reference their files rather than use their provided downloads just in case.

Basically move `tailscale` and `tailscaled` into `/usr/bin` so they're on PATH and then create the service file at `/etc/init.d/tailscale` (don't forget to make it executable with `chmod +x`)

```
#!/bin/sh /etc/rc.common

# Copyright 2020 Google LLC.
# SPDX-License-Identifier: Apache-2.0

USE_PROCD=1
START=99
STOP=1

start_service() {
  procd_open_instance
  procd_set_param command /usr/bin/tailscaled

  # Set the port to listen on for incoming VPN packets.
  # Remote nodes will automatically be informed about the new port number,
  # but you might want to configure this in order to set external firewall
  # settings.
  procd_append_param command --port 41641

  # OpenWRT /var is a symlink to /tmp, so write persistent state elsewhere.
  procd_append_param command --state /etc/config/tailscaled.state

  procd_set_param respawn
  procd_set_param stdout 1
  procd_set_param stderr 1

  procd_close_instance
}

stop_service() {
  /usr/bin/tailscaled --cleanup
}
```

You should now be able to start the service with `/etc/init.d/tailscale start` and `tailscale up` to authenticate. You might want to add on `--accept-dns=false` because you probably don't want to confuse the routers own DNS (right?)

Finally enable the service after reboot with `/etc/init.d/tailscale enable` and you're done.

### DNS

I'd love to try using this as DNS over my Tailscale network for adblocking on the go so I'll figure that out next but it probably starts with something along the lines of `tailscale up --advertise-routes=192.168.1.0/24`. OpenWrt has a package called luci-app-adblock which seems to do the trick. Shame it isn't pihole but I don't have an alternative suitable low power device at the minute.

### More Reading

[https://yomis.blog/tailscale-openwrt/](https://yomis.blog/tailscale-openwrt/)

[https://willangley.org/how-i-set-up-tailscale-on-my-wifi-router/](https://willangley.org/how-i-set-up-tailscale-on-my-wifi-router/)
