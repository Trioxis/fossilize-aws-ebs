# Backup Tag API v0.1.0-rc1

`aws-backup-manager` reads tags on EC2 objects and backs them up accordingly. 

## Backup Tag Key

An EC2 object that should be backed up by `aws-backup-manager` will have a tag with key in the form **`BackupConfig-VX`** where `X` is the major version number of the API. The value of the tag is defined below depending on the type of object. 

## Tag API for EBS volumes

## Tag API for Snapshots
