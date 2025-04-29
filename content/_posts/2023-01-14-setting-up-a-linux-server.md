---
layout: post
title: Setting up a linux server
description:
category: computing
tags: linux
modified_date: 2025-04-29
---

I normally handle almost all of the setup work on the server with [Ansible](https://www.ansible.com/), you can see my general notes [on github](https://github.com/willpower232/howiuseansibletomanageservers).

This means I can manage state manually via a git repository without being super strict and rigid (i.e. not [Chef](https://www.chef.io/)) and also control using SSH without having to host any other components.

Some initial manual setup is required to create a new user and lock down SSH access before I can involve my Ansible repository so after I create the server I need to

<ol>
	<li>if the root user is given to me with a password then change that password (not really relevant any more as both AWS and DigitalOcean default to SSH keys)</li>
	<li>
		create a user for me to use

		<pre><code>mkdir /home/wh && useradd wh --shell /bin/bash && passwd wh && chown -R wh:wh /home/wh && adduser wh sudo
</code></pre>
	</li>
	<li>
		import my base bashrc config (and then uncomment some bits at the end)

		<pre><code>mv /etc/bash.bashrc /etc/bash.bashrc.old && curl -LSs https://b.w232.co > /etc/bash.bashrc
</code></pre>

		no seriously, edit the file to change the commented out bits at the end
	</li>
	<li>
	tweak SSH server config
		<ol>
			<li>comment out `PermitRootLogin` to prevent root login (or just set it to no if that is easier)</li>
			<li>
				force key authentication for sudo users

				<pre><code>Match Group sudo
	PasswordAuthentication no
</code></pre>
			</li>
			<li>don't forget to import the SSH keys before you finish otherwise you're now cut off (also chmod 700 the .ssh folder and 400 the authorized_keys file)</li>
		</ol>
	</li>
	<li>
		finally set the timezone and name and reboot

		<pre><code>hostnamectl set-hostname yourserver.you.com && ln -sf /usr/share/zoneinfo/Europe/London /etc/localtime && shutdown -r now
</code></pre>
	</li>
	<li>also if you aren't using a script, you should definitely `sudo apt update && sudo apt upgrade -y` before getting too much more done. You probably also want to install and configure apticron and logwatch.</li>
</ol>

I'd be paranoid and check the SSH login one more time (and trying out `sudo -i`) before proceeding.

Now you have a nice stable base server to do what you want. I'd either run my ansible script to install all the various components for websites or just `apt install mariadb-server` or whatever.

I normally find that I run the setup server script so rarely that it needs a few updates as Ansible evolves and changes over time but also there are some complicated bits I haven't figured out how to automate (yet).

The most important change is to the Logwatch config which [I've documented here already](/computing/customising-logwatch.html).

Finally there is the somewhat thorny issue of how to send emails from your server. I've previously installed Postfix, configured to listen locally only but now I am looking as msmtp and SendGrid. I'm mostly drawn to `~/.msmtprc` for easy per user configuration.

If you're using DigitalOcean and didn't click the checkbox for monitoring when creating the droplet then you will need to manually install their Metrics Agent to get All The Graphs in the UI.

Past me decided to install resolvconf and I've seen that this breaks DigitalOcean droplets, you can confirm that `ping duckduckgo.com` does not work. Fortunately you can still reference `/etc/netplan/50-cloud-init.yaml` to find out what the nameservers should be and then edit `/etc/resolvconf/resolv.conf.d/tail` to include both the default nameservers and something perhaps more reliable.

<pre><code>nameserver 1.1.1.1
nameserver 8.8.8.8
nameserver whatever.something.etc.etc
nameserver whatever.something.etc.etc
</code></pre>

### SMTP Providers

I am looking to send about 150 emails per month in total across 4 servers so setting up subdomains is important. I'm not averse to paying but most providers don't care at this scale so it pays to have a rummage around the pricing pages and find where each providers tolerance is.

I first started trying to use SendGrid, I don't think they have a free tier any more but they also have a ludicrously complicated interface and its really hard to actually just send emails.

I had a go with Postmark and they have a lovely interface, it is really easy to separate your servers and track their usage. They have a free tier of 100 emails per month so I hit this quite quickly and then you're paying £15 a month which is a bit much paying 12p or so per email for something which doesn't really matter.

Elastic Email is a good option, they allow unlimited emails for free to the account holders email which works for some use cases but I had a little variety in the receiving addresses so didn't work out for me. They also include an unsubscribe link on transaction email messages which is annoying.

Brevo has more of a marketing focus, like mailchimp, but they do allow 300 emails per month for free which escapes the Postmark limitation for me. You can create server-specific passwords for SMTP but they do get you using a "master password" by default which is a little sketchy.

To be continued
