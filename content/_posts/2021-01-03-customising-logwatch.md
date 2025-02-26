---
layout: post
title: Customising Logwatch
description: getting the most out of Logwatch
category: computing
tags: linux server-config
modified_date: 2025-02-26
---

Running your own server, connected to the internet 24/7 and ready to do anything anyone tells it to, is not a small thing as you will need to pay attention to it to ensure it is doing exactly what you asked it to and nothing else.

Here are some better written posts on this topic.

[https://utcc.utoronto.ca/~cks/space/blog/sysadmin/RunningServersNotTrivial](https://utcc.utoronto.ca/~cks/space/blog/sysadmin/RunningServersNotTrivial)
[https://bitfieldconsulting.com/blog/looking-for-trouble](https://bitfieldconsulting.com/blog/looking-for-trouble)

For the casual tinkerer, there are a few ways of keeping half an eye on your server to make sure it is still there an answering requests. One of my favourites is Logwatch, it emails you daily with events from important log files of things installed on the server. One little trap is that you may need to install `rsyslog` in order to make it possible for the Logwatch scripts to see everything.

Whilst this information can be very useful, the built in levels of definition are a little too verbose in some areas (depending on your threat model/paranoia) and also good at being detected as spam by google (thanks to the resolved hostnames of malicious servers).

My solution is to set the detail to high and then update the scripts to make the output more relevant to what I can actually care about and not spam-worthy.

The perl scripts are all kept in `/usr/share/logwatch/scripts/services`, I make the following changes:

### fail2ban
- comment out `my $totalSort` and `if ($Detail >= 5) {` to closing if
- comment out `fail2ban hosts found` section

The individual banned IP addresses are unlikely to be of much relevance to you and are likely to upset spam filters. This change shows the totals banned/unbanned for each jail.

```perl
if (keys %ServicesBans) {
    printf("\nBanned services with Fail2Ban:                             Bans:Unbans\n");
    foreach my $service (sort {$a cmp $b} keys %ServicesBans) {
        printf("   %-55s [%3d:%-3d]\n", "$service:",
               $ServicesBans{$service}{'(all)'}{'Ban'},
               $ServicesBans{$service}{'(all)'}{'Unban'});
        delete $ServicesBans{$service}{'(all)'};
        #my $totalSort = TotalCountOrder(%{$ServicesBans{$service}}, \&SortIP);
        #if ($Detail >= 5) {
        #    foreach my $ip (sort $totalSort keys %{$ServicesBans{$service}}) {
        #        my $name = LookupIP($ip);
        #        printf("      %-53s %3d:%-3d\n",
        #               $name,
        #               $ServicesBans{$service}{$ip}{'Ban'},
        #               $ServicesBans{$service}{$ip}{'Unban'});
        #        if (($Detail >= 10) and ($ServicesBans{$service}{$ip}{'Failures'}>0)) {
        #            print "      Failed ";
        #            foreach my $fails (@{$ServicesBans{$service}{$ip}{'Failures'}}) {
        #                print " $fails";
        #            }
        #            print " times";
        #            printf("\n     %d Duplicate Ban attempts", $ServicesBans{$service}{$ip}{'AlreadyInTheList'}) ;
        #            printf("\n     %d ReBans due to rules reinitilizations", $ServicesBans{$service}{$ip}{'ReBan'}) ;
        #            print "\n";
        #        }
        #    }
        #}
    }
}

#if (keys %ServicesFound and $Detail>5) {
#    printf("\nFail2Ban hosts found:\n");
#    foreach my $service (sort {$a cmp $b} keys %ServicesFound) {
#        print("    $service:\n");
#        foreach my $ip (sort {$a cmp $b} keys %{$ServicesFound{$service}}) {
#            printf("       %-15s (%3d Times)\n", "$ip",
#                   $ServicesFound{$service}{$ip});
#        }
#    }
#}
```

### http
- comment out ROBOT listing, leave just the total

Robots can have random URLs which upset spam filters.

```perl
if (keys %robots and ($detail > 4)) {
   print "\nA total of ".scalar(keys %robots)." ROBOTS were logged \n";
#   foreach my $i (keys %robots) {
#      if ($detail > 9) {
#         print "   $i $robots{$i} Time(s) \n";
#      }
#   }
}
```

### pam_unix
- change the Authentication Failures regex to exclude IPs

For the lines that mention `authentication failure`, remove the final `($1)` or `($2)` which represents the IP address. This allows the rows to be grouped nicer as you don't necessarily care about the IP addresses.


### sshd
- comment out the NoIdent bit
- and BadLogins
- and IllegalUsers
- and DisconnectReceived (cen edit to show count instead)
- and UnmatchedEntries

More random IP addresses that can upset spam filters.

```perl
   if (keys %NoIdent) {
   #   print "\nDidn't receive an ident from these IPs:\n";
   #   foreach my $ThisOne (sort {$a cmp $b} keys %NoIdent) {
   #      print "   $ThisOne: " . timesplural($NoIdent{$ThisOne});
   #   }
   }
```

Probably not interested in individual lines for the failed secure connection negotiations. Thankfully it wants to give us a summary with a few well placed comment characters.

```perl
if (keys %NegotiationFailed) {
   print "\nNegotiation failed:\n";
   foreach my $Reason (sort {$a cmp $b} keys %NegotiationFailed) {
      my $Total = 0;
      print "   $Reason";
      #      if ( $Detail > 0 ) {
      #         print "\n";
      #      }
      foreach my $Host (sort {$a cmp $b} keys %{$NegotiationFailed{$Reason}}) {
        my $HostTotal = 0;
        foreach my $Offer (sort {$a cmp $b} keys %{$NegotiationFailed{$Reason}{$Host}}) {
           $HostTotal += $NegotiationFailed{$Reason}{$Host}{$Offer};
        }
        $Total += $HostTotal;
        #        if ( $Detail > 0 ) {
        #           print "      $Host: " . timesplural($HostTotal);
        #        }
        #        if ( $Detail > 5 ) {
        #           foreach my $Offer (sort {$a cmp $b} keys %{$NegotiationFailed{$Reason}{$Host}}) {
        #                 my $tot = $NegotiationFailed{$Reason}{$Host}{$Offer};
        #                 print "        $Offer: " . timesplural($tot);
        #           }
        #        }
      }
      #      if ( $Detail == 0 ) {
         print ": " . timesplural($Total);
         #      }
   }
}
```

If your SSH is open to the world, you're going to have bad logins, no need to obsess over it if fail2ban has you covered.

```perl
if (keys %BadLogins) {
#   print "\nFailed logins from:\n";
#   foreach my $ip (sort SortIP keys %BadLogins) {
#     my $name = LookupIP($ip);
#     my $totcount = 0;
#     foreach my $user (keys %{$BadLogins{$ip}}) {
#         $totcount += $BadLogins{$ip}{$user};
#      }
#      print "   $name: ". timesplural($totcount);
#      if ($Detail >= 5) {
#         my $sort = CountOrder(%{$BadLogins{$ip}});
#         foreach my $user (sort $sort keys %{$BadLogins{$ip}}) {
#            my $val = $BadLogins{$ip}{$user};
#            print "      $user: " . timesplural($val);
#         }
#      }
#   }
}

if (keys %IllegalUsers) {
#   print "\nIllegal users from:\n";
#   foreach my $ip (sort SortIP keys %IllegalUsers) {
#      my $name = LookupIP($ip);
#      my $totcount = 0;
#      foreach my $user (keys %{$IllegalUsers{$ip}}) {
#         $totcount += $IllegalUsers{$ip}{$user};
#      }
#      print "   $name: " . timesplural($totcount);
#      if ($Detail >= 5) {
#         my $sort = CountOrder(%{$IllegalUsers{$ip}});
#         foreach my $user (sort $sort keys %{$IllegalUsers{$ip}}) {
#            my $val = $IllegalUsers{$ip}{$user};
#            print "      $user: " . timesplural($val);
#         }
#      }
#   }
}
```

Disconnects are useful but the detail not that much

```perl
if (keys %DisconnectReceived) {
   print "\nReceived disconnect:\n";
   foreach my $Reason (sort {$a cmp $b} keys %DisconnectReceived) {
      my $Total = 0;
      print "   $Reason";
      foreach my $Host (sort {$a cmp $b} keys %{$DisconnectReceived{$Reason}}) {
         $Total += $DisconnectReceived{$Reason}{$Host};
#        if( $Detail > 0 ) {
#            print "\n      $Host : $DisconnectReceived{$Reason}{$Host} Time(s)";
#        }
      }
#      if( $Detail > 0 ) {
#         print "\n";
#      } else {
         print " : " . timesplural($Total);
#      }
   }
}
```

If Logwatch doesn't know how to process them, why are we bothered?

```perl
#if (keys %OtherList) {
#   print "\n**Unmatched Entries**\n";
#   print "$_ : " . timesplural($OtherList{$_}) foreach sort keys %OtherList;
#}
```

### zz-disk_space

On servers with smaller disks, it is possible for your partitions to run out of inodes so that is definitely worth keeping an eye on by adding this extra call to `df`.

```perl
#Only show disk space "df" by default -mgt
DiskSpace() if (($ENV{PRINTING} eq 'y') or $Detail);

system("df -il -x tmpfs -x devtmpfs");
print "\n";

if ( $show_disk_usage == 1 ) { DiskUsage(); }; #Turn on in zz-disk_space.conf
```

You can also make other changes in this area if your use of mountable disks is a bit more exciting.

If you are using docker on your server, then alongside the mentions of `-x tmpfs` you will probably want to add `-x overlay` as well.

