---
layout: post
title: Linux Desktop Environment
description: how I set up a linux development computer
category: computing
tags: linux software-choices
modified_date: 2021-03-06
---

Linux for first party terminal/docker/server like experience

Zorin for debian based, easy theming. It looks like FerenOS is similar but for kde instead of gnome, might give that a go at some point.

Set dark theme and highlight, clear pinned apps from whatever taskbar you have now

install bashrc files (don't forget to uncomment generic bits in /etc/bash.bashrc)
- [https://gist.github.com/willpower232/dd46da09ced0273fffc523eaf602186f](https://gist.github.com/willpower232/dd46da09ced0273fffc523eaf602186f)
- [https://github.com/cykerway/complete-alias](https://github.com/cykerway/complete-alias)

also add these files without `.bash` to the completions folder
(which you can find with `pkg-config --variable=completionsdir bash-completion`)

- [https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubens.bash](https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubens.bash)
- [https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubectx.bash](https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubectx.bash)

make sure flatpak is installed and then `sudo flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo`

remove unwanted apps from software centre (including ancient remmina)

now software centre can install flatpak apps
- flameshot
- peek
- vlc
- filezilla
- remmina
- slack
- hardware indicator sensors

if you have a microphone or fancy speakers
- PulseAudio Volume Control

also snap apps
- chromium
- opera

and regular apps
- gimp (don't forget to set color icons in preferences)

Configure firefox for maximum privacy, nice theme, and extensions

Configure chrome for maximum privacy, dark theme, and extensions (password managers and don't close with last tab)

Configure opera for some privacy

`sudo add-apt-repository ppa:ondrej/php`

`sudo add-apt-repository ppa:git-core/ppa`

`sudo apt update && sudo apt upgrade -y && sudo apt install -y vim curl git make gcc net-tools fonts-firacode dnsutils feh whois pinentry-gnome3 ttf-ancient-fonts zip unzip xclip ssh-client ttf-mscorefonts-installer dconf-editor icedtea-netx`

Install your php versions of choice, i.e. `sudo apt install -y php7.4-cli` or `sudo apt install -y php8.0-cli`

`sudo usermod -aG docker wp`

probably reboot and apt autoremove

Install pass password manager and other local `bin`s

run dconf-editor and blank out workspace shortcuts to release ctrl alt shift p, if the keyboard shortcut settings won't let you add that shortcut, you can add it directly in dconf
`org.gnome.desktop.wm.keybindings`
also disable `switch-input-source` and `switch-input-source-backwards`
also whilst you're in there
`org.gnome.desktop.wm.preferences.num-workspaces` to 1
`org.gnome.mutter.dynamic-workspaces` to off

need to reboot to apply

clear all printscreen keyboard shortcuts with backspace and set keyboard shortcuts
- Home folder - super + e
- Flameshot (flatpak run org.flameshot.Flameshot gui) - print
- passmenu --no-username - ctrl + alt + p
- passmenu --type - ctrl + alt + shift + p

(You might have to set those last two in dconf-editor if the UI won't let you)

install winehq.org
```
wget -nc https://download.opensuse.org/repositories/Emulators:/Wine:/Debian/xUbuntu_18.04/Release.key
sudo apt-key add Release.key
echo "deb http://download.opensuse.org/repositories/Emulators:/Wine:/Debian/xUbu
ntu_18.04 ./" | sudo tee /etc/apt/sources.list.d/wine-obs.list
wget -nc https://dl.winehq.org/wine-builds/winehq.key
sudo apt-key add winehq.key
sudo apt-add-repository 'deb https://dl.winehq.org/wine-builds/ubuntu/ bionic main'
plz apt update && plz apt upgrade -y
plz apt install winehq-stable
```

install docker for ubuntu following website instructions

do `sudo apt-get install python3-distutils` and get pip3 officially and with sudo and then `sudo -H pip install awscli`

install and configure vs code

don't forget about your vim preferences
- [https://gist.github.com/willpower232/5184fa16ea469461d108219523fc1bcc](https://gist.github.com/willpower232/5184fa16ea469461d108219523fc1bcc)
