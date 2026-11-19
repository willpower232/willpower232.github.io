---
layout: post
title: Downgrading Linux Kernels
description:
category: computing
tags: linux
---

For whatever reason, all of my DigitalOcean servers came down with the same running out of memory bug at the same time which happened to be when I was trying to come back from Japan and not fully equipped for the situation.

I had been apt updating from my phone and now back at my desk I saw that I had two kernels installed but a third not properly installed and every attempt to reinstall it crashed the whole server.

I chose to revert to the previous kernel and remove both the one I was on and the one that was trying to be updated to.

The first step is to confirm the fully installed kernels that grub is aware of:

`sudo grub-mkconfig | grep menuentry | grep "with Linux"`

```
 	menuentry 'Debian GNU/Linux, with Linux 6.1.0-55-amd64' --class debian --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-6.1.0-55-amd64-advanced-0bcbad84-23f8-485b-9d66-513bb480a5cb' {
	menuentry 'Debian GNU/Linux, with Linux 6.1.0-55-amd64 (recovery mode)' --class debian --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-6.1.0-55-amd64-recovery-0bcbad84-23f8-485b-9d66-513bb480a5cb' {
	menuentry 'Debian GNU/Linux, with Linux 6.1.0-54-amd64' --class debian --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-6.1.0-54-amd64-advanced-0bcbad84-23f8-485b-9d66-513bb480a5cb' {
	menuentry 'Debian GNU/Linux, with Linux 6.1.0-54-amd64 (recovery mode)' --class debian --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-6.1.0-54-amd64-recovery-0bcbad84-23f8-485b-9d66-513bb480a5cb' {
```

I also used `uname -r` to confirm what version is currently in use which for me was 6.1.0-55-amd64

The list of menuentry is 0 indexed, so I wanted the second kernel in normal mode. `sudo vim /etc/default/grub` and change GRUB_DEFAULT to `"1>2"` (note the quotes) for hilarious reasons I don't understand but I normally only have two kernels installed anyway thanks to `apt autoremove`.

`sudo update-grub` to apply the change and then reboot at your leisure but obviously don't forget to backup first presuming stable again.

Once rebooted, I confirmed the kernel version with uname again and removed the potentially problematic ones so that only the one I'm currently using is installed. I can use `sudo apt list --installed | grep linux-image` to list the packages and then `apt remove` the listed packages.

Re run grub-mkconfig as above to confirm only one kernel is present, re edit the default grub file back to GRUB_DEFAULT=0 and update-grub and reboot and pray.

I previously noted to myself that I was using the meta package linux-image-amd64 which got removed during the removals. Re adding it installed 6.1.0-56-amd64 cleanly. The meta package is the bit that means you auto update so probably want to keep that one when the dust settles but technically there is nothing stopping you from staying on the older kernel to guarantee your stability first and then update straight to the newest version later.

## References

https://www.ivanmelnyk.com/change-the-boot-kernel-version-in-linux/

https://superuser.com/questions/1358080/what-does-grub-default-12-mean/1358087
