# Security and Credentials

Some things to consider when using the backup manager

## Connecting to AWS using Access Keys

This project uses the AWS Node SDK which automatically configures itself based on a shared credential file and environment variables. To get up and running quickly, set the environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to your IAM account's access keys. Alternatively you can run the script on an EC2 instance or configure the shared credentials file, see the [instructions in AWS Node SDK Developer Guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html) for details

## IAM Roles for backup management

To protect your AWS account, you should apply a limited policy to the IAM account that the backup manager connects with. The policy should only allow management of snapshots and descriptions of volumes. Ideally it would only allow interactions with objects tagged with a `backups:config-v*` tag but this is difficult to implement and can be improved later.

The following IAM policy allows the script to run unimpeded. It is not specific enough to be used in production where security is a key concern and should be improved upon.
```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeSnapshotAttribute",
                "ec2:DescribeSnapshots",
                "ec2:CreateSnapshot",
                "ec2:DeleteSnapshot",
                "ec2:ModifySnapshotAttribute",
                "ec2:ResetSnapshotAttribute",
                "ec2:CreateTags",
                "ec2:DescribeTags",
                "ec2:DescribeVolumeAttribute",
                "ec2:DescribeVolumeStatus",
                "ec2:DescribeVolumes"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```
