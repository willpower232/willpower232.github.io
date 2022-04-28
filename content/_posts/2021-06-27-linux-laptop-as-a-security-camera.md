---
layout: post
title: Linux laptop as a security camera
description: Repurpose an old laptop as a basic motion detecting camera
category: computing
tags: linux software-choices
modified_date: 2022-04-28
---

Here I'm installing debian without a desktop environment but with the SSH server for later use. You'll need to be root but haven't got `sudo` so `su` will do for now.

Firstly you need to extend the PATH to include all the `sbin` directories. The easiest fix is to append `PATH="$PATH:/usr/local/sbin:/usr/sbin:/sbin"` to `/etc/bash.bashrc` with nano.

If you back out of `su` and go back in then you should have access to all the useful commands.

Now its wireless time. First, figure out the name of your wireless device according to the OS

`iw dev`

Mine was wlp2s0. Then you can prepare wpa_supplicant

`wpa_passphrase <network-name> <network-password> > /etc/wpa_supplicant/wpa_supplicant.conf`

You can also use this command to avoid copying and pasting when you don't have access to copy and paste (just remember to append and not overwrite)

`wpa_passphrase <network-name> <network-password> >> /etc/network/interfaces`

Now you can edit the interfaces file like this

```
allow-hotplug wlp2s0
iface wlp2s0 inet dhcp
	wpa-ssid <network-name>
	wpa-psk <encrypted-network-password>
```

Finally you can make the connection with `ifup wlp2s0` and verify the connection with `iw wlp2s0 link` and `ip a`.

You may also need to `systemctl enable wpa_supplicant` or reboot if you're having a bad time.

If you see the error message "option with an empty value" its likely there is a typo in the lines you added so double check and make sure you haven't written `dchp` or left an equals sign in `wpa-ssid=whatever`.

[Reference](https://wiki.debian.org/WiFi/HowToUse)

Now you can install the basics `sudo apt install -y vim curl net-tools dnsutils sudo rsync`

If you have a laptop that you want to keep turned on, `sudo vim /etc/systemd/logind.conf` and set `HandleLidSwitch=ignore`

## Camera Identification

Verify you have something video connected `ls -l /dev/video*`

Find the device `lsusb`

Identify available resolutions using the appropriate bus and device numbers from above `lsusb -s <bus>:<device> -v | egrep "Width|Height"`

[Reference](http://www.netinstructions.com/automating-picture-capture-using-webcams-on-linuxubuntu/)

## Motion

https://motion-project.github.io

### Install and Setup

`sudo apt install motion`

`sudo vim /etc/motion/motion.conf`

`daemon on`

`width` and `height` to something within the cameras ability (identified above) and then increase `threshold` at least proportionally, motion will adapt to match the resolutions listed above

`framerate 4` because that might be nicer if the device deals with it

`max_movie_time 600` for shorter videos

`ffmpeg_video_codec mp4` for videos that are more open-able

`target_dir` if we need to export videos easier?

`stream_localhost off` to verify easily that the video is being picked up

`webcontrol_localhost off` to verify easily that the video is being picked up

If you have to mount the camera at a weird angle then you can change `rotate` to the appropriate amount of degrees

`sudo vim /etc/default/motion` and turn daemon on then reboot.

### Now Make It Useful

#### Slack App

Create an app

Oauth and Permissions -> bot token scopes

incoming-webhook
files:write

Install App To Workspace (copy bot token)

Right click on its name in slack, open app details, add this app to a channel

[Reference](https://dev.to/c0d3b0t/upload-and-publish-a-file-on-slack-channel-with-bash-i2e)

#### bash scripts

```
#!/bin/bash

curl -F file=@$1 -F "initial_comment=$2" -F channels=<channel-ID> -H "Authorization: Bearer <bot-token>" https://slack.com/api/files.upload
```

```
#!/bin/bash

JSON="{\"channel\": \"<channel-name>\", \"text\": \"$1\"}"

curl -s -d "payload=$JSON" https://hooks.slack.com/services/<webhook-url>
```

#### configure

`output_pictures first`

`on_event_start bash /postToSlack.sh "event start %C"`

`on_event_end bash /postToSlack.sh "event end %C"`

`on_picture_save bash /uploadToSlack.sh %f "picture saved %C"`

`on_movie_end bash /uploadToSlack.sh %f "video saved %C"`
