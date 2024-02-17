---
layout: post
title: Zimaboard OpenWRT with Pihole
description:
category: computing
tags: linux
modified_date: 2024-02-17
---

Zimaboard was an easy choice for me, x86 and two ethernet jacks means lots of potential for a router use case, nevermind all the other bits that come with it.

I had a little play with CasaOS and it seemed quite capable but I spend a lot of time messing around with linux and docker elsewhere so I was more comfortable removing it and setting something up from scratch.

When I eventually got round to this project, I found that my Zimaboard would restart every few minutes with the existing CasaOS on it, not sure if there is some hibernation or power problem as hinted by Reddit or if I just left it in a weird state. The problem did not occur after installing OpenWRT so was not hardware related.

Conveniently, I had recently received an email from them with instructions for both [OpenWRT](https://icewhale.community/t/diy-your-own-cool-openwrt-router-based-on-zimaboard/73) and [pfSense](https://icewhale.community/t/build-a-powerful-home-router-with-zimaboard-and-pfsense/74) so I'm largely following their OpenWRT instructions to begin with.

## OpenWRT

The Zimaboard has the existing network plugged in on the power jack side as per their instructions, I have a keyboard and my ventoy stick connected. Bashing the F keys (F11 I think) got me to the boot menu where I can boot into Ventoy UEFI and whatever environment I happen to have.

`lsblk` identified /dev/mmcblk0 as the small eMMC onboard storage, I have downloaded the generic-squashfs-combined-efi file from the [most recent release of OpenWRT](https://downloads.openwrt.org/releases/23.05.2/targets/x86/64/) and, extracted the gz to leave an img file with `gzip -d openwrt-whatever.gz` so just needs a quick dd and a reboot (don't forget to remove your USB stick).

```
dd if=openwrt-22.03.4-x86-64-generic-squashfs-combined-efi.img of=/dev/mmcblk0 bs=1M status=progress
```

Now if you plug your computer into the network on the display port side, you should get a local IP address and go to 192.168.1.1 in your browser, you should be able to log in with no password. You can also SSH `root@192.168.1.1` with no password if you prefer to set up that way. If you find out the IP address given to the Zimaboard by your existing router, you can confirm that the web UI cannot be accessed.

Obviously the first step is setting yourself a good password.

### Getting Yourself Unstuck

If you break things to the point you can't get an IP, you can't connect remotely so you need to have a screen and keyboard plugged in to the Zimaboard and during the boot you will see a message pop up about pressing F and Enter to get into a failsafe mode where you can undo whatever it is that you did.

### Disk Size

Some prerequisites

```
opkg update

opkg install parted lsblk fdisk losetup resize2fs
```

I did `parted` and `print` to fix some awareness of the size mismatch and see how small the partitions were.

Now confirm the current setup and see that you're not using very much.

```
lsblk -o PATH,SIZE,PARTUUID
```

You will also see that some partition UUID is crucial in `cat /boot/grub/grub.cfg`, we will come back for this later so write down what you see (or open another terminal).

Now `fdisk /dev/mmcblk0` is the quickest way to replace the second partition with a much bigger one.

`p` to confirm current values (remember start and end for partition 2)

`d` and `2` to delete second partition from the table (not remove any files)

`n` for new partition

`2` for new second partition

now enter the old start value for partition 2 and just press enter to confirm the default last sector (i.e. the whole remaining disk)

`n` to not remove the signature

`w` to write the changes and quit

The `lsblk` command from earlier should confirm that the unique identifier has changed so update `/boot/grub/grub.cfg` with the new identifier.

If you reboot now, your system should still work but the writeable filesystem has not been extended to the full size of the partition so you need one last bit which I believe evaluates as `resize2fs -f /dev/loop0` but the full script is along the lines of

```
BOOT="$(sed -n -e "\|\s/boot\s.*$|{s///p;q}" /etc/mtab)"
PART="${BOOT##*[^0-9]}"
DISK="${BOOT%${PART}}"
ROOT="${DISK}$((PART+1))"
LOOP="$(losetup -n -l | sed -n -e "\|\s.*\s${ROOT#/dev}\s.*$|{s///p;q}")"
resize2fs -f ${LOOP}
```

[Reference](https://forum.openwrt.org/t/howto-resizing-root-partition-on-x86-march-2023-edition/153398)

### DHCP Configuration

It is not immediately obvious but you can configure the DHCP settings with Network > Interfaces and then Edit LAN.

You can set the interfaces IP address and netmask and it will start offering DHCP from there.

You can further customise the limits on the DHCP Server tab.

e.g.
- IPv4 address: 10.0.0.1
- IPv4 netmask: 255.255.0.0
- DHCP Server Start: 10.0.1.1 (should be a whole IP address instead of a number as this is more predictable)

Obviously be careful about breaking your nginx IP addresses and you probably need to reboot when changing these.

Don't forget there is a save button on the modal window and a save button on the interfaces page. If you find yourself in failsafe mode, you can edit `/etc/config/network` to undo whatever you just did.

## Tailscale

In theory, this would be a great exit node, allowing you to block adverts whilst on the road and access your home network however because this device is mostly functioning as a router, I don't think it will work. I've followed the basic instructions and configured sysctl but alas all I got was "destination host unreachable" from anything trying to use the exit node. I presume there is something in the firewall or routing which is stopping traffic from flowing unnaturally.

You could of course set this up as a separate device using debian or whatever within your network and have your existing router set it as the DNS server for its DHCP clients.

## Docker

If you have problems installing via opkg, you can search the list in the web UI in case the package has been renamed.

Basically `opkg install dockerd luci-app-dockerman`

You can do `ls /etc/init.d` to see a list of services.

Now you can `docker pull nginx:stable-alpine` to confirm it is all working.

### nginx

`vim /etc/config/uhttpd` to remove all the defaults and then just attach to 127.0.0.1:81 so it can't be accessed directly. Probably need to reboot to apply is probably what I did. If you get stuck, you can come back and change it to whatever you like so maybe leave the defaults commented rather than removed.

Anyway, then you can make a directory to keep all the config `mkdir -p /wpinc/nginx/conf.d`

`vim /wpinc/nginx/proxy_params`

```
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

`vim /wpinc/nginx/conf.d/default.conf`

```
server {
	listen 192.168.1.1:80;

    # don't return 404 as that breaks it

    access_log off;
    error_log /dev/null crit;
}

```

`vim /wpinc/nginx/conf.d/openwrt.conf`

```
server {
	listen 192.168.1.1:80;

	server_name openwrt.router.zz;

	location / {
		proxy_pass http://127.0.0.1:81;
		include proxy_params;
	}
}
```

`vim /wpinc/nginx.sh`

```
docker run -dit --restart always \
	--name nginx \
	--network host \
	-v /wpinc/nginx/proxy_params:/etc/nginx/proxy_params:ro \
	-v /wpinc/nginx/conf.d:/etc/nginx/conf.d:ro \
	nginx:stable-alpine
```

`sh /wpinc/nginx.sh`

Now if you modify your hosts file to point openwrt.router.zz to 192.168.1.1 then you should find it working.

If you can't then you can confirm everything is okay with `netstat -lnp` and `docker logs nginx`.

### pihole

You might think you need to disable the dnsmasq service however it handles both DHCP and DNS so this ruins everything (see Getting Yourself Unstuck above).

You need to go to DHCP and DNS > Advanced Settings and set the DNS port to 0 but obviously don't unless you're done searching the internet for a little bit.

We can reference the original script https://github.com/pi-hole/docker-pi-hole/blob/master/examples/docker_run.sh however I ran into several issues.

- It could not resolve any DNS queries internally until it was running with host networking, I guess this makes sense because the OpenWRT DNS needed to be disabled in order to free up the port
- The UI makes use of Content Security Policy which means you need to decide on the hostname you're accessing it with first and never change it.

`vim /wpinc/nginx/conf.d/pihole.conf`

```
server {
	listen 192.168.1.1:80;

	server_name pihole.router.zz;

	location / {
		proxy_pass http://127.0.0.1:82;
		include proxy_params;
	}
}
```

`docker restart nginx`

`mkdir -p /wpinc/pihole/dnsmasq /wpinc/pihole/pihole`

`vim /wpinc/pihole.sh`

```
docker run -dit --restart always \
    --name pihole \
	--net host \
	--hostname pihole \
	-e WEB_PORT=82 \
    -e TZ="Europe/London" \
    -v "/wpinc/pihole/pihole:/etc/pihole" \
    -v "/wpinc/pihole/dnsmasq:/etc/dnsmasq.d" \
    -e VIRTUAL_HOST="pihole.router.zz" \
    -e PROXY_LOCATION="pihole.router.zz" \
    -e DNSMASQ_USER=root \
	-e DNSMASQ_LISTENING=all \
    pihole/pihole:latest
```

`sh /wpinc/pihole.sh`

You could use `docker logs pihole` to see what your initial password is or you could just reset the password with the command line with `docker exec -it pihole pihole -a -p`.

If you screw up and need a full reset, you can stop and remove the container and then empty the two directories before re doing the container.

#### Updating pihole

As it is a docker container, you need to pull the latest version, stop and remove the container, then re run `sh /wpinc/pihole.sh`

### Unbound

Pihole is great and all but if you're still sending DNS requests over the usual protocols then your ISP and others can still see what you're doing.

The answer is to forward pihole to a nice DNS provider using a separate thing which uses DoH or DoT so we'll use unbound as it is also a docker image pointing at Quad9.

`mkdir -p /wpinc/unbound`

Now you need to run the mvance/unbound container and extract the default config file `docker cp unbound:/opt/unbound/etc/unbound/unbound.conf /wpinc/unbound/unbound.conf`.

You mostly need to change the port to 5053 but if you want to change the log from /dev/null to /dev/stdout then you can debug issues if you mess around with `docker logs unbound`.

`vim /wpinc/unbound/forward-records.conf`

```
forward-zone:
    # Forward all queries (except those in cache and local zone) to
    # upstream recursive servers
    name: "."
    # Queries to this forward zone use TLS
    forward-tls-upstream: yes

    # Quad9
    forward-addr: 9.9.9.9@853
    forward-addr: 149.112.112.112@853
```

`vim /wpinc/unbound.sh`

```
docker run -dit --restart always \
	--name unbound \
	--net host \
	-v /wpinc/unbound/unbound.conf:/opt/unbound/etc/unbound/unbound.conf:ro \
	-v /wpinc/unbound/forward-records.conf:/opt/unbound/etc/unbound/forward-records.conf:ro \
	mvance/unbound:latest
```

`sh /wpinc/unbound.sh`

Now back in your pihole UI, Settings > DNS. Untick the upstream DNS servers and add your own in to `192.168.1.1#5053` (yes # not :).

Finally you can confirm you're fully secure with the output of `dig +short txt proto.on.quad9.net` should confirm you're using `dot`.

If you want to do this on the zimaboard, you will need the dig command from `opkg install bind-dig`.
