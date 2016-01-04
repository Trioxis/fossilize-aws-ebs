# aws-backup-manager
Automatically back up EBS volumes using tags

[![Build Status](https://travis-ci.org/Trioxis/aws-backup-manager.svg?branch=master)](https://travis-ci.org/Trioxis/aws-backup-manager)

## What does this do?

1. Analyse the tags on your EBS volumes and snapshots according to a backup tag API
2. Make snapshots as specified by the tags on EBS volumes
3. Remove snapshots as specified by the tags on snapshots

## Backup Tag API

_To be finialised_
