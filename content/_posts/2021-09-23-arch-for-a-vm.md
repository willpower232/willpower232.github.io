---
layout: post
title: Arch for a VM
description: Sometimes you can't escape Windows
category: computing
tags: linux software-choices
modified_date: 2021-11-18
---

I want a lightweight VM so that my laptop can stay Windows and I can still develop as I am used to.

## Manual Installation

Start by making the VM in Virtualbox and boot an arch iso.

Open `cfdisk` to format the disk, select dos type when it asks otherwise none of this will work.

Make two partitions 1g or so for boot, rest for normal but mark it as bootable.

Now we can encrypt the main partition for extra security with the following commands.

```
# cryptsetup -y -v luksFormat /dev/sda2
# cryptsetup open /dev/sda2 cryptroot
# mkfs.ext4 /dev/mapper/cryptroot
# mount /dev/mapper/cryptroot /mnt
```

Finally, we need to prepare the boot partition.

```
# mkfs.ext4 /dev/sda1
# mkdir /mnt/boot
# mount /dev/sda1 /mnt/boot
```

Now we can continue with the installation, I've added a few packages to save some time, at minimum you need linux, linux-firmware if not on a VM, a text editor like vim, a boot manager like grub, and some way of networking.

```
# pacstrap /mnt base linux vim grub networkmanager doas which net-tools xclip
# genfstab -U /mnt >> /mnt/etc/fstab
# arch-chroot /mnt
```

### Initial configuration

```
# ln -sf /usr/share/zoneinfo/Europe/London /etc/localtime
# hwclock --systohc
```

Uncomment your locale from locale.gen and maybe give yourself US as well just in case (e.g. en_US.UTF-8 UTF-8)

```
# vim /etc/locale.gen
# locale-gen to generate the locales
# echo 'LANG=en-US.UTF-8' > /etc/locale.conf
```

see also localectl status and localectl list-keymaps
https://wiki.archlinux.org/title/Linux_console/Keyboard_configuration

if you need to type a fancy character like #~@" in the imminent future then you probably want the short lived version which is just `loadkeys uk`

for the future, you can set console keyboard layout in /etc/vconsole.conf with `KEYMAP=uk`

set hostname (e.g. arch) and /etc/hosts file with

```
127.0.0.1 localhost
::1 localhost
127.0.1.1 arch.localdomain arch
```

`passwd` to set root password then you can make your own account

```
mkdir /home/wp && useradd wp --shell /bin/bash && passwd wp && chown -R wp:wp /home/wp && usermod -aG wheel wp
```

### Prepare boot manager

Edit `/etc/mkinitcpio.conf` and to the `HOOKS` array, add `keyboard` between `autodetect` and `modconf` and add `encrypt` between `block` and `filesystems`. Apply with `mkinitcpio -P`.

Now we need the uuid of the partition we installed to `blkid -s UUID -o value /dev/sda2`. Take a photo or write it down.

Now edit `/etc/default/grub` and update `GRUB_CMDLINE_LINUX` with your uuid instead of `xxxx` as follows. Also set timeout to zero to save some time.

```
GRUB_CMDLINE_LINUX="cryptdevice=UUID=xxxx:cryptroot"
```

Now we can install grub (its the disk not partition!)
```
# grub-install --target=i386-pc /dev/sda
# grub-mkconfig -o /boot/grub/grub.cfg
```

### Final configuration

Allow networking to happen

```
# systemctl enable NetworkManager
```

I'm trying out `doas` instead of `sudo` but I can't just remember so `ln -s $(which doas) /usr/bin/sudo`

You need to add a group to `/etc/doas.conf`. They don't want you to use `persist` because the timeout for it is weird so `nopass` is probably preferred in this environment.

```
permit nopass :wheel
```

You can verify the config file
```
# doas -C /etc/doas.conf && echo "config ok" || echo "config error"
```

reboot to win

references:
- https://blog.bespinian.io/posts/installing-arch-linux-on-uefi-with-full-disk-encryption/
- https://wiki.archlinux.org/title/installation_guide

## Desktop Environment

full update (also if you're getting 404's then just `-Sy`)
```
# sudo pacman -Syu
```

no escape from xorg
```
# pacman -S xorg-server xorg-xinit xorg-twm xorg-xclock xterm xorg-apps
```

xfce4
```
# pacman -S xfce4 xfce4-goodies
```

need graphics
```
# pacman -S xf86-video-vesa
```

need display manager
```
# pacman -S lightdm lightdm-gtk-greeter
# systemctl enable lightdm
```

reboot to graphics and then
also now you likely have `libxkbcommon` and `libxkbcommon-x11` which means you can do
```
localectl set-x11-keymap gb
```

reference:
- https://nullcodelinux.wordpress.com/2018/01/21/installing-a-desktop-environment-on-arch-linux/

### Final Setup

In terminal Go to Edit > Preferences > General tab and uncheck "Show unsafe paste dialog".

add bashrc's and then
`pacman -S bash-completion`
probably need to add this to .bashrc
`. /usr/share/bash-completion/bash_completion`

### virtualbox guest additions

`pacman -S linux-headers gcc make perl`

mount the cdrom (sr0?) and then do the do

although apparently arch provides but its not as good maybe? (also see tips for mounting folders)
https://wiki.archlinux.org/title/VirtualBox/Install_Arch_Linux_as_a_guest

Random things which may help
```
sudo lsmod | grep vbox
sudo modprobe vboxsf
sudo pacman -S virtualbox-guest-iso
sudo rcvboxadd setup
```

for ssh client and server but you don't need to enable server
pacman -S openssh

I wanted to use podman but I just couldn't figure out how to make it work so I'm giving up on it for now.

vscode full version from yay, can't install base-devel without overwriting doas pretending to be sudo
```
# cd /opt/
# pacman -S git fakeroot
# git clone https://aur.archlinux.org/yay.git
# su wp
$ cd yay
$ makepkg -si
$ yay -S visual-studio-code-bin
```

you also need gnome-keyring or keepassxc
https://www.cogitri.dev/posts/03-keepassxc-freedesktop-secret/

`pacman -S ttf-fira-code`

also need to have `~/.gnupg/gpg-agent.conf` with `pinentry-program /usr/bin/pinentry-qt` and then `gpg-connect-agent reloadagent /bye` to reload agent

get epiphany for gnome web

### Mounting LVM

```
# cryptsetup open /dev/sdb5 whatever
# mkdir /mnt/whatever
```

if `blkid` shows you have ext4 then you can just mount it

if `blkid` shows you have LVM2_member then

```
# pacman -S lvm2
# lvscan
# vgchange -ay
# lvscan
# mount /dev/oldlvmname/root /mnt/whatever
```

### Emoji terminal support
1. install  noto-fonts-emoji package
```
# pacman -S noto-fonts-emoji --needed
```

2. add font config to `/etc/fonts/conf.d/01-notosans.conf`

```
echo "<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
 <alias>
   <family>sans-serif</family>
   <prefer>
     <family>Noto Sans</family>
     <family>Noto Color Emoji</family>
     <family>Noto Emoji</family>
     <family>DejaVu Sans</family>
   </prefer>
 </alias>

 <alias>
   <family>serif</family>
   <prefer>
     <family>Noto Serif</family>
     <family>Noto Color Emoji</family>
     <family>Noto Emoji</family>
     <family>DejaVu Serif</family>
   </prefer>
 </alias>

 <alias>
  <family>monospace</family>
  <prefer>
    <family>Noto Mono</family>
    <family>Noto Color Emoji</family>
    <family>Noto Emoji</family>
    <family>DejaVu Sans Mono</family>
   </prefer>
 </alias>
</fontconfig>

" > /etc/fonts/local.conf
```

3. update font cache via fc-cache

```
# fc-cache
```

https://dev.to/darksmile92/get-emojis-working-on-arch-linux-with-noto-fonts-emoji-2a9

## Automatic Installation

The manual installation was okay but the virtualbox integration never fully worked, I was probably missing a implicit dependency somewhere but I don't know.

I randomly found that there was an effort to create an installer which reduces a lot of the above into some easy choices https://itsfoss.com/install-arch-linux-virtualbox/

It does not currently support disk encryption with grub so you have to enable the EFI setting before starting the VM for the first time.

Boot and enter `archinstall`. Answer all the prompts, allow systemd-boot, don't allow your user to be sudo since we'll do that differently later. Select "desktop" and your environment of choice (LXQT for lightweightness). Choose virtualbox graphics and probably all the other defaults. additional packages: `vim opendoas which net-tools xclip openssh bash-completion sakura`. select the network interface rather than networkmanager to save some time and effort, allow DHCP and enter your timezone.

You don't need to chroot so exit back to installer and `shutdown now` so you can remove the iso.

Install vbox additions from cd, uninstall sudo, configure doas for group named after user you made earlier, also add user you made earlier to group vboxsf.

`sudo mount -t vboxsf -o gid=vboxsf shared_folder_name mount_point_on_guest_system`

### LXQT
- remove quick launcher and desktop switcher widgets
- lxqt preferences - appearance (icons to adwaita, theme to clearlooks)
- openbox settings (theme to bear2, desktops down to 1)

### OTHER DEs

If you want to use lxde or something not on the list then add it to the packages you install `lightdm lightdm-gtk-greeter lxde` and when prompted, you should chroot so that you can `systemctl enable lightdm`

## Thrilling Conclusion(?)

The automatic install meant that installing the virtualbox tools from the CD worked perfectly so I was able to get further with docker and vscode as above however I needed to install PHP for validating code as I write it.

I was able to install literally everything else apart from PHP 7.4. That is only available from yay and that means it needs compiling and the VM didn't quite have enough resources for that so it froze and I had to kill the VM.

At this point, I don't know if I will persist or give up and install Zorin Lite 16 when that comes out. We'll see.
