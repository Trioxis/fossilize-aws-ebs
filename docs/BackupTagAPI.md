# Backup Tag API v0.1.0-rc1

`fossilize-aws-ebs` reads tags on EC2 objects and backs them up accordingly.

## Backup Tag Key

An EC2 object that should be backed up by `fossilize-aws-ebs` will have a tag with key in the form **`fossilize:config-vX`** where **`X`** is the major version number of the API. The value of the tag is defined below depending on the type of object.

This document refers to **`v0`** of the API. So the tag key should be **`fossilize:config-v0`**

## Tag API for EBS volumes

**Each volume in an account must have a unique `Name` without commas in it. Otherwise there may be problems determining which snapshots belong to which volume**

The value of the `fossilize:config-v0` tag defines how often the EBS volume should be backed up and how long these backups are to be retained. It is in the format of a comma delimited list of tuples and aliases.

A tuple takes the form **`[x|y]`**

* **`x`** - backup **Frequency** - is an integer denoting the number of hours between successive backups
* **`y`** - backup **Expiry** - is an integer denoting the time to live (TTL) for the backup in hours

For example, the tuple `[1,12]` means the EBS should be backed up once an hour and these backups should be kept for twelve hours before they are deleted.

Aliases for these tuples exist to make the list more human-readable and can be substituted in the list in place of tuples. The aliases and their equivalent tuples are:

* **`Hourly`** = `[1|24]` - keeps at most 24 Hourly backups at a time
* **`Daily`** = `[24|168]` - keeps at most 7 Daily backups at a time
* **`Weekly`** = `[168|672]` - keeps at most 4 Weekly backups at a time
* **`Monthly`** = `[672|8760]` - keeps at most 12 Monthly backups at a time
* **`Yearly`** = `[8064|61320]` - keeps at most 7 yearly backups at a time

(Note that the names of these aliases are not entirely accurate. They don't take in to account leap years for example)

As an example, say you wanted to back up an EBS according to this schema:

* A backup every three hours for 5 days
* A backup once a week for 4 weeks
* A backup every 24 hours for 3 weeks

You would use the following value for `fossilize:config-v0`
```
[3|120],Weekly,[24|504]
```

## Tag API for Snapshots

The value of the `fossilize:config-v0` tag defines necessary metadata key-value pairs. For example, conditions that must be met for the snapshot to be deleted, or what volume the snapshot belongs to. The tag value is in the form of a comma delimited list of key-value pairs. The key and value are separated by a `:`.

The **`ExpiryDate`** value contains the date after which a snapshot should be deleted. The date value is UTC and in the format `YYYYMMDDHHmmss` (these are the [same tokens as used in moment.js](http://momentjs.com/docs/#/parsing/string-format/)).

The **`FromVolumeName`** value describes the Name tag of the volume that the snapshot was made from. It is used when determining what backup types are necessary.

The **`BackupType`** value is defined from one of the values of the `fossilize:config-v0` tag of the volume from which the snapshot was made. It is either the Alias or `[Frequency|Expiry]`.

For a snapshot that came from a backup type `[4|12]` of the volume with Name `website-data` and is set to be deleted at 11:25:13 PM on the 5th of June 2015, you would use this value for `fossilize:config-v0`
```
ExpiryDate:20150605232513,FromVolumeName:website-data,BackupType:[4|12]
```
