# Security and Credentials

Some things to consider when using the backup manager

## Connecting to AWS using Access Keys

This project uses the AWS Node SDK which automatically configures itself based on a shared credential file and environment variables.

## IAM Roles for backup management

To protect your AWS account, you should apply a limited policy to the IAM account that the backup manager connects with. The policy should only allow management of snapshots and descriptions of volumes.

The following IAM policy will allow the script to list all snapshots in the account
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1452822522000",
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeSnapshotAttribute",
                "ec2:DescribeSnapshots"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```
