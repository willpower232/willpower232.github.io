---
layout: post
title: Setting up a linux server
description:
category: computing
tags: linux
modified_date: 2023-05-07
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

		<pre><code>
hostnamectl set-hostname yourserver.you.com && ln -sf /usr/share/zoneinfo/Europe/London /etc/localtime && shutdown -r now
</code></pre>
	</li>
	<li>also if you aren't using a script, you should definitely `sudo apt update && sudo apt upgrade -y` before getting too much more done. You probably also want to install and configure apticron and logwatch.</li>
</ol>

I'd be paranoid and check the SSH login one more time (and trying out `sudo -i`) before proceeding.

Now you have a nice stable base server to do what you want. I'd either run my ansible script to install all the various components for websites or just `apt install mariadb-server` or whatever.

I normally find that I run the setup server script so rarely that it needs a few updates as Ansible evolves and changes over time but also there are some complicated bits I haven't figured out how to automate (yet).

The most important change is to the Logwatch config which [I've documented here already](/computing/customising-logwatch.html).

Finally there is the somewhat thorny issue of how to send emails from your server. I've previously installed Postfix, configured to listen locally only but now I am looking as msmtp and SendGrid. I'm mostly drawn to `~/.msmtprc` for easy per user configuration.

If you're using DigitalOcean, you will need to manually install their Metrics Agent to get All The Graphs in the UI.

To be continued
