let ec2Responses = {
	snapshots1: {
		Snapshots: [
			{
				SnapshotId: 'snap-6c9f5062',
				VolumeId: 'vol-b77cff7d',
				State: 'completed',
				StartTime: 'Sun Dec 27 2015 00:19:31 GMT+1100 (AEDT)',
				Progress: '100%',
				OwnerId: '791606823516',
				Description: 'Created by CreateImage(i-aab1ce75) for ami-bb0953d8 from vol-b77cff7d',
				VolumeSize: 50,
				Tags: [ { Key: 'Name', Value: 'web-xvdf-backup-2015-12-27-00-19' },
					{ Key: 'backups:config-v0', Value: 'ExpiryDate:201601271120' } ],
				Encrypted: false
			},

			{
				SnapshotId: 'snap-d9d374d7',
				VolumeId: 'vol-0a8631c0',
				State: 'completed',
				StartTime: 'Sat Jan 02 2016 06:58:55 GMT+1100 (AEDT)',
				Progress: '100%',
				OwnerId: '791606823516',
				Description: 'Daily backup of frg-web-xvdf',
				VolumeSize: 20,
				Tags: [ { Key: 'backups:config-v0', Value: 'ExpiryDate:201605271121' },
					{ Key: 'Name', Value: 'web-xvdf-backup-2016-01-02-06-58' } ],
				Encrypted: false
			},
		],
	},

	volumes1: {
		Volumes: [{
			VolumeId: 'vol-7290edb8',
			Size: 20,
			SnapshotId: '',
			AvailabilityZone: 'ap-southeast-2a',
			State: 'available',
			CreateTime: "Mon Dec 07 2015 11:05:56 GMT+1100 (AEDT)",
			Attachments: [],
			Tags: [],
			VolumeType: 'gp2',
			Iops: 60,
			Encrypted: false
		}, {
			VolumeId: 'vol-6b75a6a1',
			Size: 80,
			SnapshotId: '',
			AvailabilityZone: 'ap-southeast-2a',
			State: 'available',
			CreateTime: "Fri Dec 18 2015 11:15:59 GMT+1100 (AEDT)",
			Attachments: [],
			Tags:
			 [ { Key: 'backups:config-v0', Value: '[1,12],Weekly,[48,144]' },
				 { Key: 'Name', Value: 'sql-blank-mbr' } ],
			VolumeType: 'gp2',
			Iops: 240,
			Encrypted: false
		}, {
			VolumeId: 'vol-bd7cfb77',
			Size: 80,
			SnapshotId: 'snap-1c612f10',
			AvailabilityZone: 'ap-southeast-2a',
			State: 'in-use',
			CreateTime: "Fri Dec 18 2015 11:50:25 GMT+1100 (AEDT)",
			Attachments:
			 [ { VolumeId: 'vol-bd7cfb77',
					 InstanceId: 'i-aad1ce75',
					 Device: 'xvdd',
					 State: 'attached',
					 AttachTime: "Fri Dec 18 2015 11:51:58 GMT+1100 (AEDT)",
					 DeleteOnTermination: false } ],
			Tags:
			 [ { Key: 'aws:cloudformation:stack-id',
					 Value: 'arn:aws:cloudformation:ap-southeast-2:791016823516:stack/PROD-SqlStack-1MBILJJXSW63V/4e8bb270-a521-11e5-ba6c-503a22f4146e' },
				 { Key: 'aws:cloudformation:logical-id', Value: 'EBS' },
				 { Key: 'aws:cloudformation:stack-name',
					 Value: 'PROD-SqlStack-1MBILJJXSW63V' } ],
			VolumeType: 'gp2',
			Iops: 240,
			Encrypted: false
		}]
	}
};

export default ec2Responses;
