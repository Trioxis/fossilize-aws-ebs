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
				else resolve(response);
			});
		});
	}

	// A list of all EBS volumes in the AWS account. Should return a Promise.
	// Should be mapped to a format we expect. i.e.:
	// { VolumeId, Name, BackupConfig }
	listEBS () {
		return new Promise(function(resolve, reject){

			let ec2 = new AWS.EC2();

			ec2.describeVolumes({}, function(error, response){
				if (error) {
					reject(error);
				} else {

					var volumesForBackup = response.Volumes.filter(function(volumes){
						for (var i=0; i<volumes.Tags.length; i++) {
							if (volumes.Tags[i].Key === 'backups:config-v0') {
								return true;
							} else {
								return false;
							}
						}
					});

					resolve(volumesForBackup.map(function(volumes){

						var filteredForName = volumes.Tags.filter(function(tag){
							if (tag.Key === 'Name') {
								return true;
							} else {
								return false;
							}
						});

						if (filteredForName.length === 1) {
							filteredForName = filteredForName[0].Value;
						} else {
							throw new Error ('expected to receive volume with single value for name but length > 1');
						}

						var backupTag = volumes.Tags.filter(function(tag){
							if ((/[[\d\|\d\]]/g).test(tag.Value) === true){
								return true;
							} else {
								return false;
							}
						});

						if (backupTag.length === 1) {
							backupTag = backupTag[0];
						} else {
							throw new Error ('expected to receive volume with single tag for backup instructions, however length > 1');
						}

						var tagOnly = backupTag.Value.replace(/[\s]/g,'');
						var tagSplit = tagOnly.split(/,/);

						var aliasArray = {
							Hourly: [1, 24],
							Daily: [24, 168],
							Weekly: [168, 672],
							Monthly: [672, 8760],
							Yearly: [8064, 61320]
						};

						var finalBackupTag = tagSplit.map(function(tag){
							if ((/[\d]/).test(tag) === true){

								var tupleObj = {
									Expiry: parseInt(tag.split('|')[1].replace(/[[\]]/g,'')),
									Frequency: parseInt(tag.split('|')[0].replace(/[[\]]/g,''))
								};

								return tupleObj; //I've assumed that the tuple will always have two values and be in the correct order, I could write it so that it tests which value is larger to guarantee the larger one becomes Expiry

							} else if ((/[\w]/).test(tag) === true) {

								var alias = tag.replace(/[,]/g,'');

								var aliasObj = {
									Alias: alias,
									Expiry: aliasArray[alias][1],
									Frequency: aliasArray[alias][0]
								};

								return aliasObj; //I've assumed that the alias in the tag will always match the API tags

							} else {
								throw new Error ('expected tag to contain either letters or numbers, tag found that does not contain either');
							}
						});

						var finalVolSnap = {
							VolumeId: volumes.VolumeId,
							Name: filteredForName,
							BackupConfig: {
								BackupTypes: finalBackupTag
							}
						};

						return finalVolSnap;

					}));
				}

			});
		});

	}
}


export default EC2Store;
