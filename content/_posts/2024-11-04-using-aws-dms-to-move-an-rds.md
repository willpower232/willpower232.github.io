---
layout: post
title: Using AWS DMS To Move An RDS
description:
category: computing
tags: aws
modified_date: 2024-11-08
---

My task was to move databases containing tens of GB of data from one MySQL-compatible database server to another. This is mostly for doing a safe-ish upgrade of MySQL (now AWS charges extra support for 5.7-like versions) but also handy for moving things around in general.

The aim is to avoid lengthy downtime so Just Doing It In HeidiSQL ™ isn't going to help because that will take ages and probably be error prone.

AWS has the Database Migration Service which can do all the hard work in the cloud BUT of course there are a few caveats. I do this with click-ops instead of terraform because this is a one off, not a long running process.

### Preparation

Firstly and most importantly, your soon to be old database should have `binlog_format` set to `ROW`. This requires a reboot so make sure you've sorted that out before you progress too far. You can also confirm that `log_bin` is set to `ON`, if it is not `ON` then you may be looking at a reader instance and not a writer instance.

### Instance

The first step is to create a Replication Instance, this is used for all queries to your Endpoints, not just the data moving. I go with all the defaults and select Dev/Test/Single AZ mode because this instance isn't mission critical and will be long forgotten by the end of the week.

It took a couple of goes to create one first time because it had to auto-create the IAM role (and then I dared to put spaces in the name of the instance) but I gave it a minute for the IAM dust to settle and tried again and it worked.

### Endpoints

Eventually the Instance has been created so now you can create the Endpoints.

You need to select Source and Target as appropriate and then if you are using RDS then you can shortcut some of the other settings by picking "Select RDS DB Instance" to pick one.

In fact, if you are using RDS for your new database server then definitely take a moment to verify you can connect to it because it is good to confirm that before trying to connect from the AWS console, i.e. you have not got any funky or missing VPC routing.

If you are not using RDS, you will need to select which Source Engine it is using and then "Provide Access Information Manually" to see all the fields you expect.

If you have a cluster then the most important part of endpoint selection is that you pick the writer directly in both Source and Target cases as that is the only one with the binary log mentioned above. This problem is not detected until you start the Task so hopefully you have not doubled back to this point to find out what is going wrong.

Now you have a Replication Instance, the Test Endpoint Connection section will be able to work and confirm that the Endpoint settings are correct. If you skip over the test part, you can go into the Endpoint and go to the Connections tab to test directly. You will not be able to start the Task until this is successful so it seems to handle most of this itself.

Once you have created both source and target Endpoints, you can go to the source Endpoint and the Schemas tab to see the refresh button and load a list of databases available. I saw some error about a missing arn but it generated the list of schemas eventually anyway.

### Tasks

Finally you can create a task, I prefer to create one task per database being moved. You might be excited and want to create all your tasks now however there is one final change to make. On the target Endpoint, you need to modify it and set an Extra Connection Attribute: `Initstmt=SET FOREIGN_KEY_CHECKS=0;`

This is critical because the initial creation of your database is more or less guaranteed to create the tables (and insert the data) in the "wrong" order so foreign key creation will fail. I mention it as a separate step because once the database has been created, you would want to remove it so that the subsequent ongoing inserts are more typical.

I would name the task after the database you're going to move to provide flexibility and make it clear what is happening. After picking the only option from the dropdowns, the Migration Type is Migrate And Replicate and "indefinitely". Now you can use the wizard to Do Nothing on target, Stop After Applying Cached Changes. You can turn on CloudWatch Logs if you need debugging but I am going to be confident initially (foreshadowing).

The Table Mappings wizard should let you select the Schema (database) from a dropdown. You can probably leave the rest of the settings for this purpose.

I turn off the Premigration Assessment as this is a relatively simple task and now you can decide if you are starting the copy now or want to manually start it later.

Now you can start it (or have it start when it gets saved) and wait for it to either error or complete.

If it errors, you can modify the Task to have CloudWatch Logs enabled and re run the task. Don't forget to change the dropdowns to debug so it actually logs something. You probably just want Target Load and Target Apply but you never know.

If you're still not seeing any logs, make sure there is a role called `dms-cloudwatch-logs-role` which has the `AmazonDMSCloudWatchLogsRole` and has the following trust policy (if the wizard doesn't do it for you)

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

If you are looking for errors in the Log Stream then do a quick find in page in your browser for `]E:` which should find the issues although you will have to refer to the other lines to get a bit more context.

### First Run - Confirm the structure

Eventually you get to Migration Process 100% and the task should stop safely. The first step is to verify the database structure so I am going to use HeidiSQL to export the table creation statements only, not the data, and then I can use VS Code on my computer to do a side-by-side diff of the old and new databases.

In my case, I noted several massive issues in the new database

- no AUTO_INCREMENT
- no KEYs or CONSTRAINTs
- no DEFAULT values

Obviously, none of these changes are tolerable so I ended up dropping the new database and recreating it using the exported table creation statements from the old database and restarted (not resumed) the task.

You can also disable the logging at this point to save on your CloudWatch bill and delete the Log Stream if you do not need the information any longer.

### Second Run - Confirm the row counts

Now you have re run the task following the manual schema creation, or you got lucky the first time, and you have a database full of information. I noted that HeidiSQL did not think there was any content in the tables but I think that is just a side effect of all the inserts being very recent and the RDS has not fully understood what it is now full of.

Obviously you do not want to spend an age writing out lots of SQL queries so you can use this to get the repetitive work done for you by your database itself

<pre><code>SELECT CONCAT(
    'SELECT "',
    table_name,
    '" AS table_name, COUNT(*) AS exact_row_count FROM `',
    table_schema,
    '`.`',
    table_name,
    '` UNION '
)
FROM INFORMATION_SCHEMA.TABLES
WHERE table_schema = 'your_database_name';</code></pre>

Then copy the output and remove the final `UNION` from the it and you should be good to go. Also make sure your editor didn't leave the original query in the top as the column name. You can also compare the output of all the counts however you did the earlier diff.

Depending on how long it took the initial sync to complete and if you have any structure errors, you should find the numbers are identical or close enough. If there are large gaps then you may have forgotten to turn off the `FOREIGN_KEY_CHECKS` in the endpoint.

### Ongoing Runs

Once you are happy with the results of a run where the Task stops, you can resume it at your discretion and it should pick up from where it left off. You could also modify the task so it doesn't stop after the initial migration but that means you are spending even more time.

### Grand Finale

Now it is down to you to schedule a small window of downtime to complete the migration of the app which is using the database. The order would roughly be as follows:

1. stop writing data using the app, i.e. use a maintenance page or just accept a few 500 errors on the next step
2. change the password on the database user on the old database to really prevent writes to the old database
3. stop the DMS Task now there is definitely no new data in the old database (double check the table row counts if you like)
4. set up the new user and password on the new database
5. deploy your application with the new hostname, username, and password
6. delete the DMS Task now you have newer data in the new database and you can clean up the old database at your leisure

In theory the actual downtime require is quite small but hopefully you have a staging environment you can do a complete end-to-end test with first before annoying the end users of your production environment.

If you have queue workers running, it might be easier to stop them for the duration of the switchover, just to avoid a few more exceptions being recorded. Hopefully you have a Redis-powered queue to store the jobs separately from the database.
