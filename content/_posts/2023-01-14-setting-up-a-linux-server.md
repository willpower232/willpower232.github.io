---
layout: post
title: Setting up a linux server
description:
category: computing
tags: linux
modified_date: 2026-01-25
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

Elastic Email is a good option, they allow unlimited emails for free to the account holders email which works for some use cases but I had a little variety in the receiving addresses so didn't work out for me. They also include an unsubscribe link on transaction email messages which is annoying. They don't support plus addressing so you can't cheese your way around it either.

Brevo has more of a marketing focus, like mailchimp, but they do allow 300 emails per day for free which escapes the Postmark limitation. You can create server-specific passwords for SMTP but they do get you using a "master password" by default which is a little sketchy. Unfortunately they insist on including a tracking pixel which converts all plain text emails to HTML and so you can kiss goodbye to any email formatting you had hoped to include.

Scaleway also offers 300 emails per day however they have apparently decided to do everything AWS does but worse, I will proceed to help you more than Scaleway wants to. Referencing [these docs](https://www.scaleway.com/en/docs/transactional-email/how-to/generate-api-keys-for-tem-with-iam/), you can add an IAM Application per server to limit the API keys AND create a policy for each application since Scaleway doesn't seem to have any form of reuse. Each policy needs the aptly named TransactionalEmailEmailSmtpCreate permission. Then you need the project UUID (copied from the name) and the secret key you can only see once and the host and port details from those docs. If you can tolerate this garbage attempt at a permission system then this might be the one for you.

Whichever one you try and use, you can use `msmtp` to route mail sent by your server through your provider of choice, you can also install `msmtp-mta` to fake the usual email commands. The caveat is that there must be a `.msmtprc` file at the users home directory. Most of your mail can be sent by root so you need a `/root/.msmtprc` which looks a little like this

```
account default
host smtp.whatever.com
port 587
tls on
from root@yourserver.com
auth on
user username-from-your-provider
password password-from-your-provider
#logfile ~/.msmtp.log
aliases /etc/aliases
```

You can even control logging at this point to help debug connections to your provider of choice. This also means you should specify a default from and to in your `/etc/crontab` to ensure any output from the cron jobs makes its way to you.

```
MAILFROM=cron@yourserver.com
MAILTO=you@whereever.com
```

I usually add one alias to complete the loop `root: you@whereever.com` so that any email to root is actually received by me.

## Apache

I am primarily an nginx user but I am responsible for a couple of WordPress's so I forward nginx to apache so my dear associates can use .htaccess to their hearts content.

The default configuration of apache appears to have the mpm_event module enabled which is fine but might be configured a little higher than you need. I halfed the numbers to see what that would do and the worse thing that happened was apache started complaining that `MaxRequestWorkers` was not a multiple of `ThreadsPerChild` so I just took a couple more off.

## logrotate

Shout out to `/var/lib/logrotate/status` for listing every log file it has ever rotated and the last time it got rotated, handy for confirming you're rotating the files you think you are (or if something went horribly wrong in your configuration at some point and one stopped getting rotated).

## tailscale

If I am adding tailscale then I like to [create hosts file entries for each machine using hostctl](https://gist.github.com/willpower232/7ea6f3e0b016a98a4d776d10108d388a) to stand in for reverse DNS for my tailscale devices so that the logwatch email is more useful.
