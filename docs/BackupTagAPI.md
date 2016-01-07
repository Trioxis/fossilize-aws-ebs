# Backup Tag API v0.1.0-rc1

`aws-backup-manager` reads tags on EC2 objects and backs them up accordingly.

## Backup Tag Key

An EC2 object that should be backed up by `aws-backup-manager` will have a tag with key in the form **`backups:config-vX`** where **`X`** is the major version number of the API. The value of the tag is defined below depending on the type of object.

## Tag API for EBS volumes

The value of the `backups:config-v1` tag defines how often the EBS volume should be backed up and how long these backups are to be retained. It is in the format of a comma delimited list of tuples and aliases.

A tuple takes the form **`[x|y]`**

* **`x`** is an integer denoting the number of hours between successive backups
* **`y`** is an integer denoting the time to live (TTL) for the backup in hours

For example, the tuple `[1,12]` means the EBS should be backed up once an hour and these backups should be kept for twelve hours before they are deleted.

Aliases for these tuples exist to make the list more human-readable and can be substituted in the list in place of tuples. The aliases and their equivalent tuples are:

* **`Hourly`** = `[1|24]` - one backup an hour for 24 hours
* **`Daily`** = `[24|168]` - one backup a day for 7 days
* **`Weekly`** = `[168|672]` - one backup a week for 4 weeks
* **`Monthly`** = `[672|8760]` - one backup a month for 12 months
* **`Yearly`** = `[8064|61320]` - one backup a year for 7 years

As an example, say you wanted to back up an EBS according to this schema:

* A backup every three hours for 5 days
* A backup once a week for 4 weeks
* A backup every 24 hours for 3 weeks

You would use the following value for `backups:config-v1`
```
[3|120],Weekly,[24|504]
```

## Tag API for Snapshots

The value of the `backups:config-v1` tag defines conditions that must be met for the snapshot to be deleted. Currently the only condition is the expiry date of the snapshot. The value is in the form of a comma delimited list of conditions.

The **ExpiryDate** condition the date after which a snapshot should be deleted. The date value is in the format `YYYYMMddHHmmss` (these are the [same tokens as used in moment.js](http://momentjs.com/docs/#/parsing/string-format/)).

To delete a snapshot after 11:25:13 PM on the 5th of June 2015, you would use this value for `backups:config-v1`:
```
ExpiryDate:20150605232513
```
