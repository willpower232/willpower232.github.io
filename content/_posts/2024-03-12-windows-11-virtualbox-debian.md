---
layout: post
title: Windows 11 with Virtualbox and Debian
description:
category: computing
tags: linux
modified_date: 2024-03-17
---

I'm not a big fan of basing my windows account on my microsoft account so I used `oobe\bypassnro` to make an admin account named after the friendly name for the laptop and then a regular account for my every day use.

After clearing out the pre installed garbage and installing tailscale, I found I needed to give the regular account write access to the `C:\Program Files\Tailscale` in order to maintain the tailscale connection.

One of my favourite things to do is install sublime text, run it as administator and open the hosts file `C:\Windows\System32\drivers\etc\hosts` so there is quick access to it in the future. My VM didn't seem to use the hosts hosts file but its even easier to edit the local hosts file.

Installing the latest virtualbox and preparing a VM with half the CPU and half the RAM, I grabbed the latest debian ISO and installed it to the VM with the MATE desktop environment but I'm sure there is probably a better choice.

If you install no desktop environment then you could do something like `apt install xserver-xorg lightdm gnome-tweaks gnome-core --no-install-recommends && apt install vim sudo gnupg chromium`.

Now you might think I'm roughly ready to follow my usual linux desktop setup however OG debian makes it a little harder to get going so you need to follow the steps in order.

Now you're logged in as the user you created (`wh` for me) but you don't have sudo access which means the only way to get into the root user is `su`. Unfortunately they don't like you doing `su` without a user so you have to remember to `su -` instead otherwise the `PATH` will be incomplete and it is slightly more annoying as `usermod` and `reboot` won't be easily available.

If this annoys you then you can do  `export PATH="$PATH:/usr/local/sbin:/usr/sbin:/sbin"` so you can easily call the missing commands but really you want to just do `su -`. Have a read of https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=918754 but if you are really confused and want to see which package is responsible for a specific command you can use `dpkg -S <command>`.

Anyway, you need to `su -` and then you can `usermod -aG sudo wh`. With a reboot or logout/login, you can now sudo and have a better time.

The next step is to install the virtualbox addons for clipboard sharing, mounted drives, and screen resolution fixes, but there are some pre requisites `apt install linux-headers-amd64 gcc make perl --no-install-recommends`.

Now you can `Insert Guest Additions CD Image` from the Devices menu. If you open a terminal in the mounted CD folder and `sh VBoxLinuxAdditions.run` or some variant to run that particular binary. One reboot later (just in case) and you should be off to the races.

If you're planning to mount a shared folder from the host then you probably need to `usermod -aG vboxsf wh`.

Debian doesn't necessarily have immediate access to the usual ways of adding apt repos so its a bit more manual. Git comes from an ubuntu repo so you have to pick the nearest LTS ubuntu version name so it sort of matches.

```
apt install apt-transport-https ca-certificates curl software-properties-common;

wget -O /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg;
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list;

wget -O /etc/apt/trusted.gpg.d/docker.asc https://download.docker.com/linux/debian/gpg
echo "deb https://download.docker.com/linux/debian $(lsb_release -sc) stable" > /etc/apt/sources.list.d/docker.list;

gpg --recv-keys --keyserver keyserver.ubuntu.com A1715D88E1DF1F24;
gpg --export A1715D88E1DF1F24 > /etc/apt/trusted.gpg.d/git.gpg;
gpg --delete-key A1715D88E1DF1F24;
echo "deb http://ppa.launchpad.net/git-core/ppa/ubuntu jammy main" > /etc/apt/sources.list.d/git.list;
```

Verify `apt update` works before continuing to install the main packages.

```
apt install -y vim git net-tools fonts-firacode dnsutils feh whois pinentry-gnome3 ttf-ancient-fonts zip unzip xclip ssh-client docker-ce
```

Installed `docker-ce` means you get `docker-compose-plugin` but I prefer to run it separately so remember to remove it later if that is your jam. Don't forget to add yourself to the docker group and reboot before you wonder why docker is not working.

Now you should be able to start installing bits and pieces from the other article. The completions directory is still to `/usr/share/bash-completion/completions` as before, just no pkg-config to reveal that information to you unless you install it.
