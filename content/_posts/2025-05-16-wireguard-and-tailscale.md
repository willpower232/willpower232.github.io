---
layout: post
title: Configuring wireguard and tailscale at the same time
description:
category: computing
tags: linux server-config
---

I'll preface this by saying I have no idea what I am doing, other than writing down what I needed to do.

I don't know how to set up a wireguard server but I needed to have the client and tailscale functioning on the same computer.

Basically a quick `apt install wireguard resolvconf` and a config file is all I need to get going. The config file ends up in `/etc/wireguard` which exists after the `apt install`.

My wireguard config file looks like this

<pre><code>[Interface]
PrivateKey = ...
Address = 192.168.2.18/32
DNS = 192.168.2.1

[Peer]
PublicKey = ...
AllowedIPs = 192.168.2.1/32,192.168.2.18/32,0.0.0.0/0
Endpoint = 1.2.3.4:5678
</code></pre>

This forwards all my traffic through the wireguard connection which is great for the VPN but actually also fights with the tailscale connection so not having a great time at all.

I had a go with some bash aliases to juggle things but its a little annoying.

<pre><code>alias my-vpn-connect="sudo tailscale down && wg-quick up /etc/wireguard/my-vpn.conf"

alias my-vpn-disconnect="wg-quick down /etc/wireguard/my-vpn.conf && sudo tailscale up"

alias my-vpn-status='[ -z "$(sudo wg show)" ] && echo "disconnected" || echo "connected"'
</code></pre>

There seems to be two options for an easier fix, firstly you could do `Table = off` to prevent it from writing network routing tables but that makes it a bit annoying to use the VPN.

The easier option is to remove `0.0.0.0/0` and add whatever resources you are hoping to use on the other side of the VPN, for example

<pre><code>...
AllowedIPs = 192.168.2.1/32,192.168.2.18/32,192.168.1.100/32
...
</code></pre>

Now its working properly, you can use `systemctl enable --now wg-quick@my-vpn.service` to just have it around all the time but don't forget to `wg-quick down` before you try enabling the service though, otherwise it won't enable because `--now` starts it.

## More Reading

- https://shibumi.dev/posts/disable-routing-for-wireguard/
