---
layout: post
title: Self-hosted Git with Forgejo and Tailscale
description:
category: computing
tags: linux
---

Whilst I have enjoyed using Bitbucket since before GitHub offered free private repositories, neither service has been 100% flawless and I've been getting further in messing around with SSH so it makes sense to try my hand at hosting the repositories I have myself.

### Self-hosted Git

I started accessing self-hosted Git repositories over SSH in a past life but the default UI leaves a lot to the imagination. I've had Gitea in the back of my mind for some time now, mostly because of the fun name, but then I also saw Forgejo was a fork of it for [open source reasons](https://forgejo.org/faq/#why-was-forgejo-created) so have gone with that for now.

Forgejo can manage deploy keys and webhooks for packagist so should be capable for most of my use cases, Netlify does not seem to have custom connections outside of their enterprise tier so this server will mostly just be for my public code.

The [installation instructions](https://forgejo.org/docs/latest/admin/installation/#installation-from-binary) are comprehensive enough and I went with the direct binary association so I wouldn't be burned by apt updates and I started with nginx and debian as always.

```
server {
	# listen...
	# ssl_certificate...
	# ssl_certificate_key...
	# etc etc

	server_name willpoweredinc.software;

	location /.well-known {
		alias /var/www/html/.well-known;
	}

	location / {
		proxy_pass http://127.0.0.1:3000;
		include proxy_params;
	}
}
```

The installation instructions are along the lines of the following once you have [downloaded the right binary](https://codeberg.org/forgejo/forgejo/releases)

```
cp forgejo-1.20.5-0-linux-amd64 /usr/local/bin/forgejo

chmod 755 /usr/local/bin/forgejo

apt install git git-lfs

adduser --system --shell /bin/bash --gecos 'Git Version Control' --group --disabled-password --home /home/git git

mkdir /var/lib/forgejo

chown git:git /var/lib/forgejo && chmod 750 /var/lib/forgejo

mkdir /etc/forgejo

chown root:git /etc/forgejo && chmod 770 /etc/forgejo

wget -O /etc/systemd/system/forgejo.service https://codeberg.org/forgejo/forgejo/raw/branch/forgejo/contrib/systemd/forgejo.service
```

A _much_ abbreviated copy of the systemd file is

```
[Unit]
Description=Forgejo (Beyond coding. We forge.)
After=syslog.target
After=network.target

[Service]
# Uncomment the next line if you have repos with lots of files and get a HTTP 500 error because of that
# LimitNOFILE=524288:524288
RestartSec=2s
Type=simple
User=git
Group=git
WorkingDirectory=/var/lib/forgejo/
ExecStart=/usr/local/bin/forgejo web --config /etc/forgejo/app.ini
Restart=always
Environment=USER=git HOME=/home/git GITEA_WORK_DIR=/var/lib/forgejo

[Install]
WantedBy=multi-user.target
```

I left it with the default sqlite database as I knew there would only be me accessing it and this is much simpler. Also I use snapshots of the server from the provider and MySQL can have consistency issues when it is backed up whilst running. Finally it is time to `systemctl enable forgejo && systemctl start forgejo`.

Now you can visit the website and complete the initial setup. Once that is done, it is time to secure the config file

```
systemctl stop forgejo

chmod 750 /etc/forgejo && chmod 640 /etc/forgejo/app.ini
```

I then made the following changes to the app.ini file so it was only me using it

```
[openid]
ENABLE_OPENID_SIGNIN = false
ENABLE_OPENID_SIGNUP = false

[service]
DISABLE_REGISTRATION = true
```

The next most important thing to deal with is [the search engines](https://forgejo.org/docs/next/admin/search-engines-indexation/). You may be aware that there are an awful lot of web pages to look at in a git repository so the bandwidth usage can ramp up quite quickly which can be a problem if you're on a lower tier server.

Basically, you can create the directory `/var/lib/forgejo/custom/` and a `robots.txt` file with at least this content as the archives can be particularly heavy downloads.

```
User-agent: *
Disallow: /*/*/archive/
```

You can also take this opportunity to ban the AI bots from accessing your content if you wish.

#### Customisation

You may have changed the name in the initial setup but you can also change the landing page, description, and theme in the config file. I used the theme switcher in my user configuration to try them all out quickly

```
[server]
LANDING_PAGE = explore

[ui]
DEFAULT_THEME = arc-green

[ui.meta]
DESCRIPTION = Software what I made
```

Referencing the original Gitea documentation, I saw that you can also replace the images used by adding more directories to the `custom` directory mentioned earlier and then adding image files.

- `public/img/logo.svg` - Used for site icon, app icon
- `public/img/logo.png` - Used for Open Graph
- `public/img/avatar_default.png` - Used as the default avatar image
- `public/img/apple-touch-icon.png` - Used on iOS devices for bookmarks
- `public/img/favicon.svg` - Used for favicon
- `public/img/favicon.png` - Used as fallback for browsers that don't support SVG favicons

This should leave the only Forgejo reference in the footer but thats fine by me, I was mostly doing this for the social media previews when sharing links.

#### Backup

I already have a daily backup methodology on the server via a shell script so I added the following to include a copy of all Forgejo data

```
sudo -u git forgejo dump --config /etc/forgejo/app.ini -f forgejo-dump.zip
```

The default dump file includes a timestamp in the filename but as I was including this zip in another zip, I chose to give it a plainer name.

I think the dump would have to be restored manually but it is not an encrypted zip file so this would be relatively trivial if I ever needed it.

### SSH

I prefer using SSH authentication wherever possible to avoid usernames and passwords everywhere and its nicely built in everywhere I need to be but if I'm hosting _spicy_ repositories, it would be better to not have public SSH at all. This is where Tailscale comes in.

As always when messing around with SSH configuration **make sure you have a non-SSH console to access the server!**

In an ideal world, I would have the SSH daemon only listening on the Tailscale network connection so it was impossible to ever connect on the public interfaces but, spoiler alert, I could not figure it out so I just made sure the port was closed on the firewalls.

I mostly focussed on editing the SSH systemd service so that it had `Wants` or `Requires` for the Tailscale service but of course technically the service can be up but not connected so it was unfortunately not enough I guess.

```
systemctl edit ssh

[Unit]
Wants=tailscaled.service

systemctl edit tailscaled

[Units]
Before=ssh.service

systemctl daemon-reload
```

`systemd-delta` shows all overrides of config files, can delete the overrides if you want (full overrides are in /etc)

`systemctl add-requires ssh.service tailscaled` is a nicer way of doing it and `/etc/systemd/system/ssh.service.requires/tailscaled.service` link is created so should be unlinked if you want to undo it but it does not show up in `systemd-delta`.

Leaving the SSH config back at its original settings, I was able to clone the repositories as I expected substituting the Tailscale IP address for the server domain in the standard `git clone git@server domain` command.

Links I tried to follow
- https://forum.tailscale.com/t/mount-share-only-if-connected-to-tailscale/3027
- https://forum.tailscale.com/t/ubuntus-boot-order-for-tailscale-service/2341/7
- https://www.2daygeek.com/linux-modifying-existing-systemd-unit-file/
- https://stackoverflow.com/questions/49643551/systemd-service-b-to-start-after-another-service-a-only-if-service-a-exists
