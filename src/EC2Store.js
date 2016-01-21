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
	// { SnapshotId, StartTime, Name, ExpiryDate }
	// Only returns snapshots tagged with the 'backups:config-v0'
	// It is also necessary to filter out public snapshots that aren't owned by
	// the current user.
	listSnapshots () {

		return new Promise((resolve, reject) => {
			let ec2 = new AWS.EC2();
			ec2.describeSnapshots({}, function (err, response) {
				if (err) reject(err);

				else {
					var snapshotsForBackup = response.Snapshots.filter(function(snap){
						for (var i=0; i<snap.Tags.length; i++) {
							if (snap.Tags[i].Key === 'backups:config-v0') {
								return true;
							}
						}
						return false;
					});

					resolve(snapshotsForBackup.map(function(snap){

						var filteredForName = snap.Tags.filter(function(tag){
							if (tag.Key === 'Name'){
								return true;
							} else {
								return false;
							}
						});

						if (filteredForName.length === 1) {
							filteredForName = filteredForName[0];
						} else {
							throw new Error('expected to receive snapshot with a single value for name but length > 1');
						}

						var filteredForDate = snap.Tags.filter(function(tag){
							if (tag.Value.slice(0,10) === 'ExpiryDate'){
								return true;
							} else {
								return false;
							}
						});

						if (filteredForDate.length === 1) {
							filteredForDate = parseInt(filteredForDate[0].Value.slice(11,23));
						} else {
							throw new Error('expected to receive snapshot with a single value for expiry date but length > 1');
						}

						var finalSnapshot = {
							SnapshotId: snap.SnapshotId,
							StartTime: snap.StartTime,
							Name: filteredForName.Value,
							ExpiryDate: filteredForDate
						};

						return finalSnapshot;
					}));
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
