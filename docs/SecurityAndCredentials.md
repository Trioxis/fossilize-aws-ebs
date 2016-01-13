# Security and Credentials

Some things to consider when using the backup manager

## Connecting to AWS using Access Keys



## IAM Roles for backup management

To protect your AWS account, you should apply a limited policy to the IAM account that the backup manager connects with. The policy should only allow management of snapshots and descriptions of volumes.
