---
layout: post
title: Moving Gists From GitHub
description:
category: computing
tags: linux
---

You probably know it has been a rough year for GitHub and it has only fueled peoples interests in self hosting their git repos. Gists are slightly different, whilst they are git repos, they are typically devoid of commit messages, CI, PRs, etc, etc so whilst it would be relatively easy to move them to a full git repo somewhere else, the different user experience would get annoying.

I was recently pointed in the direction of [Opengist](https://opengist.io/) which offers a reasonably close experience, there aren't currently comments but its easily got the rest of it.

## Installation

I've been really enjoy my [self hosted git server]({% post_url 2023-11-11-self-hosted-git %}) so it was easy enough to fire up another docker-compose.yml Tailscale sidecar.

```
services:
  opengist-ts:
    image: tailscale/tailscale
    hostname: opengist
    restart: unless-stopped
    dns: 8.8.8.8 # enable external lookups
    volumes:
      - ./tailscale:/var/lib/tailscale
    environment:
      - TS_AUTHKEY=...
      - TS_STATE_DIR=/var/lib/tailscale

  opengist:
    image: ghcr.io/thomiceli/opengist:1.15 # zip -r -y before each version update just in case
    network_mode: service:opengist-ts
    environment:
      - UID=1000
      - GID=1000
      - OG_HTTP_PORT=80
      - OG_SSH_PORT=22
    restart: unless-stopped
    volumes:
      - ./opengist:/opengist
```

Adding further configuration with more environment variables is very simple. I use OAuth against Forgejo so I have fewer logins to remember to sort of match the GitHub experience, this also imports your SSH keys. It is also easy to customise the UI with logos and links.

After you login, you'll become the administrator and whilst you probably want to immediately disable registration in the Admin area of the site, you want to leave the login form enabled because it is actually needed to use the "init" functionality later.

## Moving Gists

As GitHub gists only have a single branch, you don't have to use a mirror clone to move the repo. GitHub gists can be cloned with `git clone git@gist.github.com:bunchofnumbersandletters` (you can't specify the user like with traditional repos), then you can go in the folder and `git remote set-url origin http://your.tailscale.ip.address/init`.

When you `git push` you'll be prompted to login so if you used OAuth, you'll need to set a password for your user first. Also if you disable the login form, I think that unsets the passwords for the OAuth users so you would need to re set the password.

This will give you the new URL so if you're going to keep the cloned gist then you should update immediately to avoid creating lots of copies however as I'm not, I'm just cloning the gists into `/tmp` so that everything will be tidied up eventually.

### Making the URLs match

Now I don't make a habit of memorising 32 character random strings but for consistency, I'd like the URLs to be the same. The UI of Opengist does allow you to go in and update the name of the gist and also provide an override URL but the recently generated one is still there.

As Opengist just uses sqlite, you can use any sqlite editor to fix the data. I like to use [openvsdb](https://marketplace.visualstudio.com/items?itemName=snitzle.openvsdb) with VS Code Remote Development to get there without having to move the sqlite file closer to me. Either way, don't forget to move the folder that contains the repo otherwise I'm sure something will break.

Now when I get round to moving all the gists I care about and updating my backups, I can just change the hostname on the git remote url rather than the whole thing.
