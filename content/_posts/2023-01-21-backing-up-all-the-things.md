---
layout: post
title: Backing up all the things
description:
category: computing
tags: linux
---

I am a big fan of the Microsoft OneDrive that comes with the office subscription I have for all my personal files and photos and there are any number of options for mirroring the content out of the cloud onto a big drive but I also have a whole bunch of text files in code repositories and littered across a server or two which also need backing up so that is what I'm going to talk about here.

## Where

I have a spare computer and a 1TB SSD so that can sit headless somewhere and I can fit everything I need there. I can auth to the git repositories with an SSH key and use the same key for scraping the files off my servers so this computer can have its own key no problem.

To make it easier, I'll make a directory in the root of the hard drive called backups so its all in one casual place. To make the final parts easier, I'll make a subfolder called working so the backed up content is also in its own place and then I can mess around with the scripts between the two.

## What

I'll start by syncing the content from my servers. Having added the public key to the right place, its an easy rsync. As part of setting up my servers, I keep the websites and configuration in one folder so easy enough to download almost everything in that folder. The secret of course is to add your main server user to each other users group so you have basic read access to everything.

```
#!/bin/bash

rsync rvt --links --progress wh@myserver.com:/wpinc /backups/working/myserver/ --exclude=letsencrypt --exclude=tmp --exclude=logs --delete
```

Keeping each servers files separate means that when a server is retired, the last copy of the files can be easily archived without disturbing the whole thing.

If you want, you could also add some call to a reporting service if you wanted to record you had backed up stuff here since the really unique and important stuff is covered now.

I'll start with gits and gists folders in the working subfolder. Obviously we need all branches and tags from our various repositories so we can use a mirror when cloning the repositories.

```
git clone --mirror git@github.com:username/repo.git
```

It turns out you can also grab gists in a similar way which is very handy.

```
git clone --mirror git@gist.github.com:123456789.git
```

Now everything is cloned, the next part of the script will simply loop through the folders and update them.

```
REPOS=("gists" "gits")
for REPO in "${REPOS[@]}"; do
	DIRS=($(find /backups/working/$REPO -name *.git -type d))
	for DIR in "${DIRS[@]}"; do
		cd "$DIR"
		pwd
		git remote update
	done
done
```

### 3-2-1

So now you have two copies of everything and you could be done but it won't be super safe unless you have a third copy somewhere completely different and "off site".

I'm a big fan of Backblaze for object storage (others are available of course) and their B2 service which offers 10GB free and then is cheaper after that than S3 so seems like a solid place to get started.

I initially used a program called duplicity and it seemed to be pretty good however the restore method was not obvious or trivial so I ended up using tar and GPG directly and then the b2 cli to sync the resulting files up to my bucket.

As the backup computer is only responsible for encrypting files, you can make the process easier by only adding your GPG public key to the backup computer. This doesn't need the passphrase to encrypt objects so makes the automation less complex.

You can export the public key like this, substituting your key ID `gpg --armor --export me@my-encryption-key.com > encryption.asc` and then import it on the backup computer `gpg --import encryption.asc`.

You will want to edit the imported public key to tell GPG to trust it `gpg --edit-key me@my-encryption-key.com`, you can apply ultimate trust from there.

Again I'll make a dedicated directory for the compressed encrypted files called scratch next to the working directory.

Now it is just a matter of looping through the working directories and outputting the files to the scratch directory.

```
DIRS=("gists" "gits" "server1" "server2")
for LOCAL_DIR in "${DIRS[@]}"; do
	echo "starting $LOCAL_DIR..."

	tar czf - working/${LOCAL_DIR} | gpg -r me@my-encryption-key.com -e > scratch/${LOCAL_DIR}.tar.gz.gpg

	echo "finished $LOCAL_DIR"
done
```

You can add v into czf if you want more detailed output and if you didn't have a GPG encryption key, you could use `-c` instead of `-e` for a regular passworded encryption. To skip the prompt in this case, you would do `-c --passphrase yourpassword` otherwise you probably have to `export GPG_TTY=$(tty)`.

Finally, you can now sync the scratch folder into the cloud using the [b2 cli](https://github.com/Backblaze/B2_Command_Line_Tool) which looks like

```
b2 authorize-account abcdefghijkl 012345678901234567890123456789012345678901

b2 sync /backups/scratch/ b2://your-backup-bucket/
```

Before I forget, you will want to double check the retention settings in the bucket to make sure you only keep backups for as long as you want to. You can also set up a backblaze account in a different region and set up bucket replication so you have multiple copies of your backups in the cloud.

In my setup, I have each of these parts as separate script files but they could be combined into one process if you wanted.
