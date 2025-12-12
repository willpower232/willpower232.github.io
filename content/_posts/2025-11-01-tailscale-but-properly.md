---
layout: post
title: Using Tailscale Properly
description:
category: computing
tags: linux
modified_date: 2025-12-12
---

I've written a couple of times about using [Tailscale](https://tailscale.com/) but not really documented how I'm using it. I'm also definitely using it "wrong" so I'll try to atone for that now.

Tailscale is a device-to-device mesh style VPN using wireguard, you install it on every device you use and now you can directly and securely access every other device without having to open ports.

Its also _enthusiastically_ free at a very reasonable level for home use which is great for getting introduced to it.

## Problem 1 - key expiry

At this point, you can install tailscale on any device, tailscale up, and join it to your tailnet. What they don't tell you is that you now have 6 months before you have to manually reapprove the device.

As a bash shell customiser, I added this to my .bashrc and it has been quite useful. The important part is that you don't forget `tailscale up --force-reauth` but don't do it on ssh over tailscale as you'll get cut off.

```
if [[ "$TERM" == "xterm-256color" && "$SHLVL" == "1" ]]; then
	echo ""

	if [[ $(which tailscale) != "" ]]; then
		expiryEpoch=$(date -d $(tailscale status --json | jq -r '.Self.KeyExpiry') +%s)
		nowEpoch=$(date +%s)

		if [[ $(($expiryEpoch - $nowEpoch)) -lt $((86400 * 3)) ]]; then
			echo -e "tailscale key expiring soon, time to \e[38;5;208mtailscale up --force-reauth\e[0m but not over ssh, obviously"
		fi
	fi
 fi
 ```

You can go into the console and disable key expiry for some of your devices given that having a server randomly disconnect sucks but that isn't really what tailscale wants you to do.

## Problem 2 - who is really the user of the device

Obviously tailscale is targetted at businesses and organisations, and that is where they make their money, but even at the free tier, you can use their tagging feature to label servers and other devices where you don't log in. Adding a tag *replaces* you as the user of the device in the eyes of tailscale as well as automatically disabling key expiry. This is really a one way process as you can't remove all tags from a device.

It only really matters if you have other users in your tailnet (or are a business) and want to secure access in between your network. I had a little look but mostly ended up tying myself in knots and the default "everything can access everything else" access control is fine.

One side effect of tagging devices is that as they are no longer "yours", you can't use taildrop with them so I end up using rsync with ssh or scp in Windows.

It does nicely sort the list of machines in the app so that things like your phone and computers are at the top and the tagged devices are grouped separately.

## Problem 3 - ports or hosts

I am used to servers and port wrangling and I am used to docker and docker compose fighting for ports so that is what I initially set up but what is infinitely easier is adding tailscale docker container as a "sidecar".

In your main docker image, change the network mode to `service:whatever-ts` and then you can grab a one use auth key and add

```
whatever-ts:
	image: tailscale/tailscale
	hostname: whatever
	restart: unless-stopped
	volumes:
		- ./tailscale:/var/lib/tailscale
	environment:
		- TS_AUTHKEY=tskey-auth-something-somethingelse
		- TS_STATE_DIR=/var/lib/tailscale
```

If you swap `whatever` to the name of your service then when it appears in the console, it will be named something cool and useful. All you have to do then is make sure that your service is on port 80 and you'll have a great time in most things unless you're relying on a different port.

This means I'm no longer wrangling a lot of ports on the same server and everything has a nice name in my tailscale console so now how to easily handle the tailscale IP addresses.

Tailscale would love you to use their MagicDNS so everything you have is on one of their ts.net domains but I'm unsure about messing up my local DNS arrangements.

My first attempt at solving this combined `tailscale status` with hostctl https://gist.github.com/willpower232/7ea6f3e0b016a98a4d776d10108d388a but that didn't really help with using it on my phone. Obviously you could copy the IP address out of the tailscale app but I wanted something easier still. That said I do like doing this as a stand in for reverse DNS so that my logwatch emails can identify which tailscale device I SSHed in from.

I already have a short domain for my server so I just added the tailscale IP addresses to my public DNS records and called it a day.

### HTTPS

If you wanted to use MagicDNS and their `ts.net` subdomains then you can supply a serve.json to the tailscale docker image and do more things if you like https://gist.github.com/dkaser/f4f21e864ead60bc5d059b1c819627dc (note the double dollar for docker compose reasons)

## Problem 4 - sharing access

I have both one service and a tailscale exit node I'd like to share. I got them to create a tailscale account and add it to their devices before sharing the two tailscale machines to their account.

I was briefly worried that I'd have to add some access control but that doesn't seem necessary in my "everything can access everything else" universe but if you don't have one of those then you probably want to have a look at using the `autogroup:shared` as the source.

## Problem 5 - SSH

Tailscale would love you to use Tailscale SSH to access your devices and I'm sure its great but I already have SSH keys everywhere for using with git and one device which has selectively public access so I can't really rely on it.

Either way, you can totally block public SSH access with your cloud server provider and connect using your tailscale IP address or subdomains as you would any other server. I do have one place with a static IP address so I do keep it slightly open but basically don't have to worry about fail2ban any more.
