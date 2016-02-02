import AWS from 'aws-sdk';
AWS.config.update({region: 'ap-southeast-2'});

// Class that gets information from AWS using the AWS Node API.
class EC2Store {
	// TODO: Decide if/where credentials are passed in to the class. Usually they're
	//	automatically loaded from the instance IAM roles or ~/.aws/credentials
	//	but we should be able to override them
	constructor () {

	}

	// A list of all snapshots in the AWS account. Should return a Promise.
	// Snapshots returned should be mapped to a format we expect. i.e.:
	// { SnapshotId, StartTime, Name, ExpiryDate, ...<Other Tags> }
	// Only returns snapshots tagged with the 'backups:config-v0'
	// It is also necessary to filter out public snapshots that aren't owned by
	// the current user.
	listSnapshots () {

		return new Promise((resolve, reject) => {
			let ec2 = new AWS.EC2();

			ec2.describeSnapshots({}, (err, response) => {
				if (err) {
					reject(err);
				} else {

					let snapshots = response.Snapshots.map(snapResponse => {
						let snap = {};
						snap.Tags = {};
						snap.Name = snapResponse.SnapshotId;
						snap.SnapshotId = snapResponse.SnapshotId;
						snap.StartTime = snapResponse.StartTime;
						snapResponse.Tags.map(tag => {
							snap.Tags[tag.Key] = tag.Value;
							if (tag.Key === 'Name') snap.Name = tag.Value;
						});
						return snap;
					}).filter(snap => {
						if (snap.Tags['backups:config-v0']) {
							return true;
						} else {
							return false;
						}
					}).map(snap => {
						let backupConfig = snap.Tags['backups:config-v0'].split(',');
						backupConfig.map(backupParam => {
							let [key, value] = backupParam.split(':');
							if (key === 'ExpiryDate') {
								snap.ExpiryDate = value;
							}
						});
						delete snap['backups:config-v0'];
						return snap;
					});
					resolve(snapshots);
				}
			});
		});
	}

	// A list of all EBS volumes in the AWS account. Should return a Promise.
	// Should be mapped to a format we expect. i.e.:
	// { VolumeId, Name, BackupConfig }
	listEBS () {
		return new Promise((res) => {res([]);});
	}
}


export default EC2Store;
