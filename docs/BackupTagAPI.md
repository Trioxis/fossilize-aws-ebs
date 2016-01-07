# Backup Tag API v0.1.0-rc1

`aws-backup-manager` reads tags on EC2 objects and backs them up accordingly.

## Backup Tag Key

An EC2 object that should be backed up by `aws-backup-manager` will have a tag with key in the form **`backups:config-v1`** where `X` is the major version number of the API. The value of the tag is defined below depending on the type of object.

## Tag API for EBS volumes

The value of the **`backups:config-v1`** tag defines how often the EBS volume should be backed up and how long these backups are to be retained. It is in the format of a comma delimited list of tuples and aliases.

A tuple takes the form **`[x|y]`**

* **x** is an integer denoting the number of hours between backups
* **y** is an integer denoting the time to live (TTL) for the backup in hours

For example, the tuple `[1,12]` means the EBS should be backed up once an hour and these backups should be kept for twelve hours before they are deleted.

Aliases for these tuples to make the list more human-readable and can be substituted in the list for tuples. The aliases are:

* `Hourly` = `[1|24]` - one backup an hour for 24 hours
* `Daily` = `[24|168]` - one backup a day for 7 days
* `Weekly` = `[168|672]` - one backup a week for 4 weeks
* `Monthly` = `[672|8760]` - one backup a month for 12 months
* `Yearly` = `[8064|61320]` - one backup a year for 7 years

## Tag API for Snapshots
