---
layout: post
title: Using AWS DMS To Move An RDS
description:
category: computing
tags: aws
---

My task was to move databases containing tens of GB of data from one MySQL-compatible database server to another. This is mostly for doing a safe-ish upgrade of MySQL (now AWS charges extra support for 5.7-like versions) but also handy for moving things around in general.

The aim is to avoid lengthy downtime so Just Doing It In HeidiSQL ™ isn't going to help because that will take ages and probably be error prone.

AWS has the Database Migration Service which can do all the hard work in the cloud BUT of course there are a few caveats. I do this with click-ops instead of terraform because this is a one off, not a long running process.

### Preparation

Firstly and most importantly, your soon to be old database should have binlog_format set to row. This requires a reboot so make sure you've sorted that out before you progress too far.

### Instance

The first step is to create a Replication Instance, this is used for all queries to your Endpoints, not just the data moving. I go with all the defaults and select Dev/Test/Single AZ mode because this instance isn't mission critical and will be long forgotten by the end of the week.

It took a couple of goes to create the first time because it had to auto-create the IAM role (and then I dared to put spaces in the name of the instance) but I gave it a minute for the IAM dust to settle and tried again and it worked.

### Endpoints

Eventually the Instance has been created so now you can create the Endpoints.

You need to select Source and Target as appropriate and then if you're using RDS then you can shortcut some of the other settings by picking "Select RDS DB Instance" to pick one.

In fact, if you are using RDS for your new database server then definitely take a moment to verify you can connect to it because it is good to confirm that before trying to connect from the AWS console.

If you aren't using RDS, you will need to select which Source Engine it is using and then "Provide Access Information Manually" to see all the fields you expect.

If you have a cluster then the most important part of endpoint selection is that you pick the writer directly and specifically as that is the only one with the binary log.

Now you have a Replication Instance, the Test Endpoint Connection section will be able to work and confirm that the endpoint settings are correct. If you skip over the test part, you can go into the Endpoint and go to the Connections tab to test directly. You will not be able to start the Task until this is successful so it seems to handle most of this itself.

Once you have created both source and destination Endpoints (if you have a cluster, remember to select the appropriate reader and writer instances or the correct endpoint), you can go to the source Endpoint and the Schemas tab to see the refresh button and load a list of databases available. I saw some error about a missing arn but it generated the list of schemas eventually anyway.

### Tasks

Finally you can create a task. You might be excited and want to create all your tasks now however there is one final change to make. On the target Endpoint, you need to modify it and set an Extra Connection Attribute: Initstmt=SET FOREIGN_KEY_CHECKS=0;

This is critical because the initial creation of your database is more or less guaranteed to create the tables in the "wrong" order so foreign key creation will fail. I mention it as a separate step because once the database has been created, you would want to remove it so that the subsequent ongoing inserts are more typical.

I would name the task after the database you're going to move to provide flexibility and make it clear what is happening. After picking the only option from the dropdowns, the Migration Type is Migrate And Replicate and "indefinitely". Now you can use the wizard to Do Nothing on target, Stop After Applying Cached Changes. You can turn on CloudWatch Logs if you need debugging but I'm going to be confident initially.

The Table Mappings wizard should let you select the Schema (database) from a dropdown. You can probably leave the rest of the settings for this purpose.

I turn off the Premigration Assessment as this is a relatively simple task and now you can decide if you're starting the copy now or want to manually start it later.

Now you can start it (or have it start when it gets saved) and wait for it to either error or complete.

If it errors, you can modify it to have CloudWatch Logs enabled and re run the task. Don't forget to change the dropdowns to debug so it actually logs something. You probably just want Target Load and Target Apply but you never know.

If you're still not seeing any logs, make sure there is a role called dms-cloudwatch-logs-role which has the AmazonDMSCloudWatchLogsRole and has the following trust policy (if the wizard doesn't do it for you)

<pre><code>{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "dms.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}</code></pre>

To be continued...
