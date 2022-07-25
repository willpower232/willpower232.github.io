---
layout: post
title: Linux Desktop Environment
description: how I set up a linux development computer
category: computing
tags: linux software-choices
modified_date: 2022-02-21
---

Linux for first party terminal/docker/server like experience. Whilst mac OS has a great terminal, it uses a virtual machine for docker and that is just annoying. Windows is just...not great for how I want to develop.

I've always used Ubuntu/Debian based so I am more comfortable there. Zorin OS is based on Ubuntu with simpler theming than most other distributions and very polished.

The only thing that has irked me about Zorin OS so far is that somehow suspend on screen lock got enabled and neither of my computers recovered properly so definitely check that before progressing too far.

### Cosmetics

Set dark theme, layout, and highlight colour and clear pinned apps from whatever taskbar you have now.

### Terminal

install bashrc files (don't forget to uncomment generic bits in /etc/bash.bashrc)
- [https://gist.github.com/willpower232/dd46da09ced0273fffc523eaf602186f](https://gist.github.com/willpower232/dd46da09ced0273fffc523eaf602186f)
- [https://github.com/cykerway/complete-alias](https://github.com/cykerway/complete-alias)
(copy the file as ~/.bash_completion)

Add the git-aware-prompt bash plugin

```
mkdir ~/.bash
cd ~/.bash
git clone git://github.com/jimeh/git-aware-prompt.git
```

Finally, add the following files without `.bash` to the completions folder
(which you can find with `pkg-config --variable=completionsdir bash-completion`)

- [https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubens.bash](https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubens.bash)
- [https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubectx.bash](https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubectx.bash)

If you want a windows-like hostname then you can do something like this and reboot. Don't forget to update the hosts file though.
`sudo hostnamectl set-hostname DESKTOP-\$(head /dev/urandom | tr -dc A-Z0-9 | head -c 7)`

### Software

Zorin OS 16 should have flatpak installed and set up, can check with `sudo flatpak remote-list` then if you can't see flathub `sudo flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo`

remove unwanted apps from software centre (including ancient remmina). You should use the app list to check if any things you don't want are installed via apt, (i.e. libreoffice)

now software centre can install flatpak apps
- flameshot
- peek
- vlc
- filezilla
- remmina
- slack
- open office desktop editors
- postman
- geary
- gnome web (for safari-related debugging)

if you have a microphone or fancy speakers
- PulseAudio Volume Control

(Don't forget to turn off auto gain in Slack if you're adjusting it with PulseAudio)

also snap apps (I'd prefer flatpaks for everything but I think you get better widevine support with snap browsers which is handy for netflix etc)
- chromium
- opera

and regular apps
- gimp (don't forget to set color icons in preferences and also turn off toolbox grouping)

Configure firefox for maximum privacy, nice theme, and extensions

Configure chrome for maximum privacy, dark theme, and extensions (password managers and don't close with last tab)
- right-click the address bar and choose 'Always show full URLs'. If you don't see that option, go to chrome://flags/#omnibox-context-menu-show-full-urls and set the highlighted flag to 'Enabled'.

Configure opera for some privacy, I usually use opera for background media and email so its definitely worth checking widevine/netflix if thats what you want ([this is useful](https://www.reddit.com/r/operabrowser/wiki/opera/linux_widevine_config)). I did experience initial loading problems with snap opera but regular opera did not have working widevine initially.

Instead of Hardware Indicator Sensors I started using [this particular system monitor](https://extensions.gnome.org/extension/120/system-monitor/) which is a bit more interesting and less buggy in my experience.

If you're really into gnome extensions, this [extension manager](https://flathub.org/apps/details/com.mattjakeman.ExtensionManager) would be a good install.

#### Development Stuff

`sudo add-apt-repository ppa:ondrej/php`

`sudo add-apt-repository ppa:git-core/ppa`

`sudo apt update && sudo apt upgrade -y && sudo apt install -y vim curl git make gcc net-tools fonts-firacode dnsutils feh whois pinentry-gnome3 ttf-ancient-fonts zip unzip xclip ssh-client ttf-mscorefonts-installer dconf-editor icedtea-netx`

Install your php versions of choice, i.e. `sudo apt install -y php7.4-cli` or `sudo apt install -y php8.0-cli`. Actually you probably want to install both to validate everything you do and then choose the one you want to use with `sudo update-alternatives --config php`.

probably reboot and apt autoremove

If you're dual booting with Windows, you'll need to set the registry key `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\TimeZoneInformation\RealTimeIsUniversal` as a DWORD to 1 and disable the Windows Time Service ([Windows just really likes local time](https://help.ubuntu.com/community/UbuntuTime#Make_Windows_use_UTC))

#### Password Manager

Install pass password manager with terminal, do ctrl x + e to do a lot of commands then this

```
sudo apt install -y build-essential xz-utils unzip git tree;
wget https://git.zx2c4.com/password-store/snapshot/password-store-1.7.4.tar.xz;
tar xf password-store-1.7.4.tar.xz;
cd password-store-1.7.4;
sudo make install;
cd ../;
wget https://github.com/palortoff/pass-extension-tail/archive/v1.2.0.zip;
unzip v1.2.0.zip;
cd pass-extension-tail-1.2.0;
sudo make install;
cd ../;
rm -rf pass-extension-tail-1.2.0/ password-store-1.7.4* v1.2.0.zip;
```

These may install to `/usr/lib/password-store/extensions` so make sure the completions are in the folder you found earlier.

#### HeidiSQL (and Windows support)

install zorin-windows-app-support (with apt) or via the software store.

Here it is manually if you want it from winehq.org

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

I'd normally just download the portable version of HeidiSQL and create a shortcut in `~/.local/share/applications/heidisql.desktop` then bung an image in `~/.local/share/icons`.

```
[Desktop Entry]
Type=Application
Terminal=false
Name=HeidiSQL
Exec=sh -c "cd ~/Downloads/heidisqlportable/; wine start heidisql.exe"
StartupWMClass=heidisql.exe
Icon=heidisql
StartupNotify=true
```

If you haven't salvaged an old portable install of it, you should definitely open the preferences and

1. make sure `Allow multiple application instances` is **checked**
2. make sure `Automatically reconnect to previously opened sessions on startup` is cleared
3. make sure `Restore last used database on startup` is cleared
4. don't change the Style Theme from Windows (unless it is less crashy these days)
5. don't change the Icon pack from Icons8 (unless blah blah)
6. set the Editor font to Cousine if the letter spacing is way off
7. make sure `Remember filters, sorting and column selection across sessions` is cleared
8. make sure `Reopen previously used SQL files and unsaved content in tabs` is cleared

Clearing those checkboxes means that if you have a bad time, Heidi won't repeat the chaos when it gets reopened.

### Final bits

If you're having trouble generating passwords after crudely importing your `.gnupg`, make sure there isn't a hidden character in the .gpg-id file.

Install other local `bin`s

run dconf-editor and blank out workspace shortcuts to release ctrl alt shift p, if the keyboard shortcut settings won't let you add that shortcut, you can add it directly in dconf
`org.gnome.desktop.wm.keybindings`
also disable `switch-input-source` and `switch-input-source-backwards`
also whilst you're in there
`org.gnome.desktop.wm.preferences.num-workspaces` to 1
`org.gnome.mutter.dynamic-workspaces` to off

need to reboot to apply

clear all printscreen keyboard shortcuts with backspace and set keyboard shortcuts
- Home folder - super + e
- Hide window - ctrl + alt + zero
- Flameshot (flatpak run org.flameshot.Flameshot gui) - print
- passmenu --no-username - ctrl + alt + p
- passmenu --type - ctrl + alt + shift + p

You will need to specify the full path to passmenu if it isn't in the regular $PATH and you might have to set the keys for passmenu in dconf-editor if the UI won't let you.

install [docker for ubuntu](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)

`sudo usermod -aG docker wp`

do `sudo apt-get install python3-distutils` and get pip3 officially and with sudo and then `sudo -H pip install awscli` (or just follow the official instructions?)

install and configure vs code
- manually install https://github.com/IronLu233/vscode-color-exchange
- add globalStorage and History to `.config/Code/User/syncLocalSettings.json` under  `ignoreUploadFolders`

don't forget about your vim preferences and gitconfig
- [https://gist.github.com/willpower232/5184fa16ea469461d108219523fc1bcc](https://gist.github.com/willpower232/5184fa16ea469461d108219523fc1bcc)

```
[core]
	autocrlf = input
	fileMode = false
	editor = vim
	untrackedCache = true
[user]
	name = Your Name
	signingkey = YOURCHOSENGPGKEY
[commit]
	gpgsign = true
[gpg]
	program = gpg
[init]
	defaultBranch = main
[push]
	default = simple
[pull]
	rebase = false
[alias]
	# https://egghead.io/lessons/git-make-my-git-log-look-pretty-and-readable
	kraken = log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --branches
```

Finally, Zorin comes with a service called touchegg installed and running by default. If you don't have a touchscreen or trackpad directly connected you can probably disable it to save some memory.
