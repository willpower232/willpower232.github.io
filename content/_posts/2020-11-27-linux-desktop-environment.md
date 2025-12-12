---
layout: post
title: Linux Desktop Environment
description: how I set up a linux development computer
category: computing
tags: linux software-choices
modified_date: 2025-12-12
---

Linux for first party terminal/docker/server like experience. Whilst mac OS has a great terminal, it uses a virtual machine for docker and that is just annoying. Windows is just...not great for how I want to develop.

I've always used Ubuntu/Debian based so I am more comfortable there. Zorin OS is based on Ubuntu with simpler theming than most other distributions and very polished.

The only thing that has irked me about Zorin OS so far is that somehow suspend on screen lock got enabled and neither of my computers recovered properly so definitely check that before progressing too far. I think I found it under Privacy and Screen in the settings

### Cosmetics

Set dark theme, layout, and highlight colour and clear pinned apps from whatever taskbar you have now.

In Ubuntu, I found that I was missing the main font for logging in with Microsoft so thankfully there is a way of getting Segoe in your life from https://github.com/mrbvrz/segoe-ui-linux. Basically once you've followed their installer you can

```
mkdir -p ~/.config/fontconfig
vim ~/.config/fontconfig/fonts.conf
```

with this content

```
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <match target="pattern">
    <test qual="any" name="family"><string>Segoe UI Webfont</string></test>
    <edit name="family" mode="assign" binding="same"><string>Segoe UI</string></edit>
  </match>
</fontconfig>
```

then `fc-cache -fv; fc-match "Segoe UI Webfont"` to check. Should return `segoeui.ttf: "Segoe UI" "Regular"`. Probably have to restart almost everything to apply fully so just endure the serif for a little bit longer I'd say.

### Terminal

You probably want to install the apt packages from below here.

install bashrc files (don't forget to uncomment generic bits in /etc/bash.bashrc)
- [https://gist.github.com/willpower232/dd46da09ced0273fffc523eaf602186f](https://gist.github.com/willpower232/dd46da09ced0273fffc523eaf602186f)
- [https://github.com/cykerway/complete-alias](https://github.com/cykerway/complete-alias)
(copy the file as ~/.bash_completion)

Add the git-aware-prompt bash plugin

```
mkdir ~/.bash
cd ~/.bash
git clone https://github.com/jimeh/git-aware-prompt.git
```

Finally, add the following files without `.bash` to the completions folder
(which you can find with `pkg-config --variable=completionsdir bash-completion`)

- [https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubens.bash](https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubens.bash)
- [https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubectx.bash](https://raw.githubusercontent.com/ahmetb/kubectx/master/completion/kubectx.bash)

If you want a windows-like hostname then you can do something like this and reboot. Don't forget to update the hosts file though.
`sudo hostnamectl set-hostname DESKTOP-$(head /dev/urandom | tr -dc A-Z0-9 | head -c 7)`

### Software

Zorin OS should have flatpak installed and set up, can check with `sudo flatpak remote-list` then if you can't see flathub `sudo flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo`. Ubuntu doesn't have flatpak or the default software centre so you need to `sudo apt install flatpak` AND `sudo apt install gnome-software --install-suggests` and then just don't open the default app centre.

Remove unwanted apps from software centre (worth checking the ones you leave which could be super old like Remmina which is much newer in flatpak form). You should use the app list to check if any things you don't want are installed via apt, (i.e. libreoffice). Unfortunately, you will also need to manually remove libreoffice-common via apt in your terminal.

now software centre can install flatpak apps
- flameshot
- peek
- vlc
- filezilla
- remmina
- slack
- ONLYOFFICE desktop editors
- ~postman~ bruno is better as it keeps your data on your computer
- geary or thunderbird which looks slightly nicer currently
- gnome web (for safari-related debugging)
- break timer
- chromium
- ~opera~ I'm using a firefox fork instead, currently floorp
- Antares SQL

if you have a microphone or fancy speakers
- PulseAudio Volume Control

(Don't forget to turn off auto gain in Slack if you're adjusting it with PulseAudio)

and regular apps
- gimp (don't forget to set color icons in preferences and also turn off toolbox grouping)

It looks like I don't have any snap apps at the minute (apart from slack which refused to stay logged in). Opera struggles with widevine for some reason so I ended up using Chromium for netflix etc.

In Thunderbird, you can hide the local folders with the Folder Pane Header which can be toggled under View > Folders > Folder Pane Header. The Folder Pane Header can hide itself once you've shown it and hidden the local folders.

Configure firefox for maximum privacy, nice theme, and extensions. I do like to open local HTML files sometimes and I needed to install Flatseal to give flatpak Firefox permission to my home directory.

Configure chrome for maximum privacy, dark theme, and extensions (password managers and don't close with last tab)
- right-click the address bar and choose 'Always show full URLs'. If you don't see that option, go to chrome://flags/#omnibox-context-menu-show-full-urls and set the highlighted flag to 'Enabled'.

~Configure opera for some privacy, I usually use opera for background media and email so its definitely worth checking widevine/netflix if thats what you want ([this is useful](https://www.reddit.com/r/operabrowser/wiki/opera/linux_widevine_config)). I did experience initial loading problems with snap opera but regular opera did not have working widevine initially. For whatever reason, "Show Full URL" is a setting and not on the right-click menu.~ Floorp can b adapted similarly to opera to remove all the rando toolbars and make it look slightly nice.

Instead of Hardware Indicator Sensors I started using [this particular system monitor](https://extensions.gnome.org/extension/120/system-monitor/) which is a bit more interesting and less buggy in my experience. Unfortunately it seems to not be updated any more however there is a [new fork](https://extensions.gnome.org/extension/3010/system-monitor-next/) which works nicely. Don't forget to `sudo apt install gir1.2-gtop-2.0 gir1.2-nm-1.0 gir1.2-clutter-1.0` and maybe `sudo apt-get install lm-sensors && sudo service kmod start && sudo sensors-detect` although it doesn't seem I have many sensors available to me which is odd. If the plugin isn't changing when you update the preferences, just lock and unlock and that should be enough to apply your latest preferences. Also don't forget `sudo apt install htop` for some backup in looking at your systems status.

I have started using [Burn My Windows](https://extensions.gnome.org/extension/4679/burn-my-windows/) to make things a little more snazzy. If you find that the computer sleeping the monitors re arranges your windows (or worse, crashes the whole computer) you can use [unblank](https://extensions.gnome.org/extension/1414/unblank/) to keep the screens awake at all times to make using the computer easier.

If you're really into gnome extensions, this [extension manager](https://flathub.org/apps/details/com.mattjakeman.ExtensionManager) would be a good install.

Finally there is [Modern CSV](https://www.moderncsv.com) which is ridiculously efficient at editing CSV files, much better than ONLYOFFICE at this.

#### Development Stuff

`sudo add-apt-repository ppa:ondrej/php`

`sudo add-apt-repository ppa:git-core/ppa`

`sudo apt update && sudo apt upgrade -y && sudo apt install -y gnupg vim curl git make gcc net-tools fonts-firacode dnsutils feh whois pinentry-gnome3 ttf-ancient-fonts zip unzip xclip ssh-client ttf-mscorefonts-installer dconf-editor icedtea-netx`

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
9. reduce the query history days to say 1 or 2, it is handy after all

Clearing those checkboxes means that if you have a bad time, Heidi won't repeat the chaos when it gets reopened.

### Final bits

If you're having trouble generating passwords after crudely importing your `.gnupg`, make sure there isn't a hidden character in the .gpg-id file.

If you'd like to set yourself a garbage password because this system isn't online much, you can do `sudo passwd <username>` to bypass the block on garbage passwords. Don't forget to change the keychain password to match though (good luck reading black text on a dark background).

Install other local `bin`s

run dconf-editor and blank out workspace shortcuts to release ctrl alt shift p, if the keyboard shortcut settings won't let you add that shortcut, you can add it directly in dconf
`org.gnome.desktop.wm.keybindings`

also disable `switch-input-source` and `switch-input-source-backwards`

also whilst you're in there
`org.gnome.desktop.wm.preferences.num-workspaces` to 1
`org.gnome.mutter.dynamic-workspaces` to off
`org.gnome.desktop.interface.gtk-enable-primary-paste` to off

If you happen to have a big background to span across all your monitors, you might have to set `org.gnome.desktop.background` to `spanned`.

need to reboot to apply

In order for the workspaces setting to work I also ended up in Settings > Multitasking, switching it to "fixed number of workspaces" and "workspaces on all displays".

clear all printscreen keyboard shortcuts with backspace and set keyboard shortcuts
- Home folder - super + e
- Hide window - ctrl + alt + zero
- Flameshot (flatpak run org.flameshot.Flameshot gui) - print
- passmenu --no-username - ctrl + alt + p
- passmenu --type - ctrl + alt + shift + p

Don't forget that if you don't have a print key, you could borrow the windows print screen shortcut or just Ctrl Alt Shift S even.

You will need to specify the full path to passmenu if it isn't in the regular $PATH and you might have to set the keys for passmenu in dconf-editor if the UI won't let you.

install [docker for ubuntu](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository) (but I'd probably use `/usr/share/keyrings` as that directory actually exists) and then make sure you have `apt remove docker-compose-plugin` if you like managing your own binary for that purpose.

`sudo usermod -aG docker wp`

install aws cli from the [official instructions](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

VS Code has some weird instructions nowadays which are a little too complicated for my liking. You just need the `asc` with `sudo curl -fsSL https://packages.microsoft.com/keys/microsoft.asc -o /usr/share/keyrings/microsoft.asc` and then you can add in `/etc/apt/sources.list.d/vscode.sources` as follows

```
Types: deb
URIs: https://packages.microsoft.com/repos/code
Suites: stable
Components: main
Architectures: amd64,arm64,armhf
Signed-By: /usr/share/keyrings/microsoft.asc
```

(It looks like their apt output doesn't behave the same way as the OG version so you have to use this newer syntax but at least you don't have to convert the asc to gpg unnecessarily.)

Then you can `apt update` and `apt install code`. If you can import the previous profile then you can probably skip the below but if you do import the profile, don't forget to expand the extensions section so it actually installs the extensions you had.

In the old days I had to
- manually install https://github.com/IronLu233/vscode-color-exchange
- add globalStorage and History to `.config/Code/User/syncLocalSettings.json` under  `ignoreUploadFolders`
- using the customise layout button I like to put quick input in the centre and justify the panel alignment which isn't in the preferences json for some reason

Don't forget you probably have to [increase this magic number](https://code.visualstudio.com/docs/setup/linux#_visual-studio-code-is-unable-to-watch-for-file-changes-in-this-large-workspace-error-enospc).

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
	signingkey = ~/.ssh/id_ed25519.pub
[commit]
	gpgsign = true
[gpg]
	format = ssh
[init]
	defaultBranch = main
[push]
	default = simple
	autoSetupRemote = true
[pull]
	rebase = false
[alias]
	unpushed = log --branches --not --remotes --no-walk --decorate --oneline
	# https://egghead.io/lessons/git-make-my-git-log-look-pretty-and-readable
	kraken = log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --branches

[includeIf "hasconfig:remote.*.url:git@github.com:personalname/**"]
	path = .gitconfig-personal

[includeIf "hasconfig:remote.*.url:git@github.com:organisationname/**"]
	path = .gitconfig-work
[includeIf "hasconfig:remote.*.url:git@github.com:OrganisationName/**"]
	path = .gitconfig-work
```

and then in .gitconfig-whatever you just have your email address

```
[user]
	email = me@home.com
```

The break timer application should be set up with "a mix of short breaks and long breaks" so you can do the 20 second break every 20 minutes (to relax your eyes by looking at something 20 feet away) and a 4 minute break every hour so you remember to get up and make a drink.

Finally, Zorin comes with a service called touchegg installed and running by default. If you don't have a touchscreen or trackpad directly connected you can probably disable it to save some memory.

### Future Things To Remember

Every so often Docker likes to bring up the minimum api version which is a great way of reminding you that you're using some super old docker containers or tools.

Obviously it would be nice to update but sometimes (cough portainer) it takes a couple of weeks for a docker-based tool to get updated and it takes a few minutes for people to fill Github issues with wild ideas like downgrading docker itself and locking the apt version.

The best answer is to create (or update) `/etc/docker/daemon.json` and add `"min-api-version": "1.24"` or whatever version was the most recent minimum.
