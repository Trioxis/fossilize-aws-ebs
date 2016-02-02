import AWS from 'aws-sdk';
AWS.config.update({region: 'ap-southeast-2'});

let BACKUP_API_TAG = 'backups:config-v0';
let ALIASES = {
	Hourly: [1, 24],
	Daily: [24, 168],
	Weekly: [168, 672],
	Monthly: [672, 8760],
	Yearly: [8064, 61320]
};

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
							if (snap.Tags[i].Key === BACKUP_API_TAG) {
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

						var filteredDateString = snap.Tags.filter(function(tag){
							var expiryDate = 'ExpiryDate';
							if (tag.Value.indexOf(expiryDate) > -1) {
								return true;
							} else {
								return false;
							}
						});

						if (filteredDateString.length === 1) {
							filteredDateString = filteredDateString[0].Value.split(', ');
						} else {
							throw new Error('expected to receive an array with a single tag for expiry date but length > 1');
						}

						var filteredDateOnly = filteredDateString.filter(function(string){
							var expiryDate = 'ExpiryDate';
							if (string.indexOf(expiryDate) > -1) {
								return true;
							} else {
								return false;
							}
						});

						if (filteredDateOnly.length === 1) {
							filteredDateOnly = parseInt(filteredDateOnly[0].slice(11,23));
						} else {
							throw new Error('expected to receive an array with a single value for expiry date but length > 1');
						}

						var finalSnapshot = {
							SnapshotId: snap.SnapshotId,
							StartTime: snap.StartTime,
							Name: filteredForName.Value,
							ExpiryDate: filteredDateOnly
						};

						return finalSnapshot;
					}));
				}
			});
		});
	}

	// A list of all EBS volumes in the AWS account. Should return a Promise.
	// Should be mapped to a format we expect. i.e.:
	// { VolumeId, Name, BackupConfig, Tags }
	listEBS () {
		return new Promise( (resolve, reject) => {

			let ec2 = new AWS.EC2();
			let prettyPrintVol = (vol) => {
				return '(' + vol.VolumeId +') \'' + vol.Name +'\'';
			};

			ec2.describeVolumes({}, (error, response) => {
				if (error) {
					reject(error);
				} else {

					// Map response object to volume objects
					let volumes = response.Volumes.map(volumeResponse => {
						let volume = {};

						// If the volume has no Name tag, use its id as the name instead
						volume.Name = volumeResponse.VolumeId;

						// Convert tags to properties on volume object
						volume.Tags = {};
						volumeResponse.Tags.map(tag => {
							volume.Tags[tag.Key] = tag.Value;
							if (tag.Key === 'Name') volume.Name = tag.Value;
						});

						volume.VolumeId = volumeResponse.VolumeId;
						return volume;

						// only return volumes with the backup tag
					}).filter(volume => volume.Tags.hasOwnProperty(BACKUP_API_TAG) )
						.map(volume => {
							// Convert backup tag to backup config object
							volume.BackupConfig = {};
							volume.BackupConfig.BackupTypes = [];

							volume.Tags[BACKUP_API_TAG].split(',').map(backupType => {
								// If the backup type is a tuple, this will equal an array with three elements
								let tuple = backupType.match(/\[(\d+)\|(\d+)\]/);

								if (tuple && tuple.length === 3) {
									volume.BackupConfig.BackupTypes.push({
										Frequency: parseInt(tuple[1]),
										Expiry: parseInt(tuple[2])
									});
								} else if (ALIASES.hasOwnProperty(backupType)) {
									volume.BackupConfig.BackupTypes.push({
										Alias: backupType,
										Frequency: ALIASES[backupType][0],
										Expiry: ALIASES[backupType][1]
									});
								} else {
									console.warn('AWSBM WARN: Volume '+ prettyPrintVol(volume) +': Could not interpret backup type \'' + backupType + '\'. Please ensure the \'' + BACKUP_API_TAG + '\' tag is valid');
								}
							});
							return volume;
						}
					).filter(volume => {
						// sanitise array of failed mappings
						if (!volume || !volume.VolumeId || !volume.Name) {
							console.warn('AWSBM WARN: Volume response from AWS could not be interpreted properly. It was mapped to:');
							console.warn(volume);
							return false;
						} else if (!volume.BackupConfig || !volume.BackupConfig.BackupTypes || volume.BackupConfig.BackupTypes.length === 0) {
							console.warn('AWSBM WARN: Volume '+ prettyPrintVol(volume) +': Ignoring volume because its \'' + BACKUP_API_TAG + '\' tag could not be intepreted. Please check it is in a valid format.');
							return false;
						}

						volume.BackupConfig.BackupTypes = volume.BackupConfig.BackupTypes.filter(type => {
							if (!type.Frequency || !type.Expiry) {
								console.warn('AWSBM WARN: Volume '+ prettyPrintVol(volume) +': Ignoring backup type \'' + type +'\'. Please check the volume\'s \'' + BACKUP_API_TAG + '\' tag is valid');
								return false;
							}
							return true;
						});

						return true;
					});
					resolve(volumes);
				}
			});
		});
	}
}


export default EC2Store;
