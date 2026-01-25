---
layout: post
title: Configuring nginx to work only on tailscale
description:
category: computing
tags: linux server-config
modified_date: 2026-01-25
---

## Background

My [laptop as a camera project]({% post_url 2021-06-27-linux-laptop-as-a-security-camera %}) relies on using slack for a quick and dirty way of sharing the pictures and video it takes however [Slack have decided to get rid of the simple endpoint](https://api.slack.com/changelog/2024-04-a-better-way-to-upload-files-is-here-to-stay) in favour of two to make a presumably less server intensive way of doing things.

Given Slacks overall hatred of people having free accounts, I thought I would come up with something to replace the process which happened to match the Slack API to make it easier.

Also with both server and camera/laptop on my tailscale network I wanted to make use of the more direct way of the camera transferring the files to my code.

## Problem

Adding a new vhost in nginx that only listens on the tailscale IP is just as easy as you might think however I had a bad feeling and went for a server reboot to see what would happen and indeed, the tailscale IP was not ready by the time nginx was so nginx refused to start.

Frustratingly this took a while to find any information on so here I am documenting it.

As I am using debian and there is systemd involved, I needed to have a look at the service file `/etc/systemd/system/multi-user.target.wants/nginx.service` and in my case the `After` line was already `After=network-online.target remote-fs.target nss-lookup.target`, the `-online` part of `network-online` being regularly crucial.

I added `tailscaled.service` to the end of the `After` line and ran `systemctl daemon-reload` as I think you're supposed to do.

## Problem 2

Rebooting the server did not change anything and after a little more digging, now I was in the right place, it turns out that [the service is telling systemd it is ready before the IP address is available](https://github.com/tailscale/tailscale/issues/11504).

I went with `mkdir -p /etc/systemd/system/tailscaled.service.d/` and `vim /etc/systemd/system/tailscaled.service.d/override.conf` with one of the suggestions

```
[Service]
ExecStartPost=timeout 60s bash -c 'until tailscale status --peers=false; do sleep 1; done'
```

One more `systemctl daemon-reload` and a reboot proved that the problem was now resolved.

## Problem 3

You didn't think that would be the end of it did you? Unfortunately in spite of all the above, subsequent updates removed the modifications so instead I changed `/etc/crontab` to include `@reboot root sleep 15 && systemctl start nginx` to act as a super fallback.

## The Actual Solution

Unfortunately 15 seconds wasn't always the right amount of time so a tip of my hat goes to Bernat for getting in touch, digging a little deeper and providing their solution.

I'm guessing that ExecStartPost isn't delaying the next part of systemd but one can of course delay nginx from starting. Similar to before, `mkdir -p /etc/systemd/system/nginx.service.d/` and `vim /etc/systemd/system/nginx.service.d/override.conf`

```
[Service]
ExecStartPre=
ExecStartPre=timeout 60s bash -c 'until tailscale status --peers=false; do sleep 1; done'
ExecStartPre=/usr/sbin/nginx -t -q -g 'daemon on; master_process on;'
```

I also took the liberty of removing the tailscale override.conf I added before the next `systemctl daemon-reload`.

By way of explanation, the empty ExecStartPre prevents any previous one applying, we included the official ExecStartPre as the third one (note the `-t` to indicate nginx is testing the config before trying to start). You'll recognise the second ExecStartPre from before.

## More Reading

- [Convenient reddit thread providing all the answers](https://www.reddit.com/r/Tailscale/comments/ubk9mo/systemd_how_do_get_something_to_run_if_tailscale/)
- [Random help article about making sure nginx waits for the network](https://www.ispmanager.com/docs/ispmanager-business/if-nginx-does-not-start-after-rebooting-the-server)
