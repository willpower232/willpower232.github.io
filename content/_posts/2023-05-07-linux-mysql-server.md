---
layout: post
title: Setting up a linux MySQL server
description:
category: computing
tags: linux
---

Following on from [Setting up a linux server]({% post_url 2023-01-14-setting-up-a-linux-server %}), installing a MySQL server has some other steps to make sure the server you're setting up is secure.

I delegate a lot of the security to my server providers firewalls (or security group in AWS-speak) so that only other servers I own can reach this server which forces me to use tunnels to manage it.

If you have set up the same SSH keys on your web server and your database server then you should be able to use jump hosts like this `ssh -J wh@yourserver.you.com wh@databaseserver.you.com`.

First step is to install the database server, then start and enable the service so it is always running. It is also worth pointing out that this will install the MySQL 8 equivalent of MariaDB so you may need to tweak the password encryption for your application users.

<pre><code>sudo apt-get install mariadb-server mariadb-client -y
sudo systemctl enable mariadb
sudo systemctl start mariadb
</code></pre>

Thankfully they provide the same script to secure your installation `sudo /usr/bin/mysql_secure_installation`

I went with the following options

- no root password by default
- switch to unix_socket authentication
- don't change root password since it is local only by socket
- rm anonymous users
- disallow root login remotely
- rm test database
- reload privilege tables

You can verify this has loosely worked by comparing `mysql` (which won't let you in) and `sudo mysql` (which will). Now you need to provide remote access to the root user (or a user with all the permissions) for your main server which comes in two parts.

Firstly, now you're in the mysql cli you can do

<pre><code>GRANT ALL ON . to 'root'@'yourserver.you.com' IDENTIFIED BY '[password]' WITH GRANT OPTION;
FLUSH PRIVILEGES;
</code></pre>

Secondly, you need to get the database server using a public port to expose it to your web server. You can `sudo vim /etc/mysql/mariadb.conf.d/50-server.cnf` and change `127.0.0.1` to `0.0.0.0`.

After restarting the database server, you should be able to tunnel your local computer `ssh -L 9999:databaseserver.you.com:3306 -N wh@yourserver.you.com` and then your client of choice can use host 127.0.0.1 and port 9999 with root and `[password]` from earlier.

Finally, if you need to change the password encryption for a specific user to support, the query is

<pre><code>ALTER USER '[user]'@'yourserver.you.com' IDENTIFIED WITH mysql_native_password BY '[password]'
</code></pre>
