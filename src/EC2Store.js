import AWS from 'aws-sdk';
AWS.config.update({region: 'ap-southeast-2'});

import moment from 'moment';

let BACKUP_API_TAG = 'backups:config-v0';
let ALIASES = {
	Hourly: [1, 24],
	Daily: [24, 168],
	Weekly: [168, 672],
	Monthly: [672, 8760],
	Yearly: [8064, 61320]
};
let EXPIRY_DATE_FORMAT = 'YYYYMMDDHHmmss';

let prettyPrintVol = (vol) => {
	return `(${vol.VolumeId}) '${vol.Name}'`;
};

let prettyPrintSnap = (snap) => {
	return `(${snap.SnapshotId}) '${snap.Name}'`;
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
	// { SnapshotId, StartTime, Name, ExpiryDate, Tags }
	// Only returns snapshots tagged with the 'backups:config-v0'
	// It is also necessary to filter out public snapshots that aren't owned by
	// the current user.
	listSnapshots () {
		let warnings = [];

		return new Promise((resolve, reject) => {
			let ec2 = new AWS.EC2();

			ec2.describeSnapshots({}, (err, response) => {
				if (err) {
					reject(err);
				} else {

					let snapshots = response.Snapshots.map(snapResponse => {
						let snap = {};

						// Use snapshot id if a Name tag does not exist
						snap.Name = snapResponse.SnapshotId;
						snap.SnapshotId = snapResponse.SnapshotId;
						snap.FromVolumeId = snapResponse.VolumeId;
						// NOTE: Ingesting date value with it's time zone (ZZ)
						snap.StartTime = moment(snapResponse.StartTime, 'ddd MMM DD YYYY HH:mm:ss ZZ');
						snap.FromVolumeName = undefined;
						snap.BackupType = undefined;
						snap.ExpiryDate = undefined;

						// Map EC2 tags to easy to use Tag object
						snap.Tags = {};
						snapResponse.Tags.map(tag => {
							snap.Tags[tag.Key] = tag.Value;
							if (tag.Key === 'Name') {
								snap[tag.Key] = tag.Value;
							}
						});

						return snap;

						// remove snapshots that have no backups:config-v0 tag
					}).filter(snap => snap.Tags.hasOwnProperty(BACKUP_API_TAG)
					).map(snap => {
						// map the backups:config-v0 tag on to the snapshot object
						let backupConfig = snap.Tags[BACKUP_API_TAG].split(',');

						backupConfig.map(backupParam => {
							let [key, value] = backupParam.split(':');

							// Check the expiry date is in YYYYMMDDHHmmss format (14 digits)
							if (key === 'ExpiryDate') {
								if (new RegExp(`^\\d{${EXPIRY_DATE_FORMAT.length}}$`).test(value)) {
									// NOTE: Ingest date as a UTC date using moment.utc()
									if (moment.utc(value, EXPIRY_DATE_FORMAT).isValid()) {
										snap.ExpiryDate = moment.utc(value, EXPIRY_DATE_FORMAT).local();
									} else {
										warnings.push(`Snapshot ${prettyPrintSnap(snap)}: ExpiryDate set to undefined because the parsed value '${value}' is not a valid date in ${EXPIRY_DATE_FORMAT} format. Check the ExpiryDate in '${BACKUP_API_TAG}' is valid`);
									}
								} else {
									warnings.push(`Snapshot ${prettyPrintSnap(snap)}: ExpiryDate set to undefined beacuse the parsed value '${value}' is invalid. Check the '${BACKUP_API_TAG}' tag is valid and ExpiryDate is in ${EXPIRY_DATE_FORMAT} format`);
								}
							} else if (key === 'FromVolumeName' || key === 'BackupType') {
								snap[key] = value;
							} else {
								warnings.push(`Snapshot ${prettyPrintSnap(snap)}: Unknown '${BACKUP_API_TAG}' parameter: '${backupParam}'`);
							}
						});
						return snap;
					});
					resolve({snapshots, warnings});
				}
			});
		});
	}

	// A list of all EBS volumes in the AWS account. Should return a Promise.
	// Should be mapped to a format we expect. i.e.:
	// { VolumeId, Name, BackupConfig, Tags }
	listEBS () {
		let warnings = [];
		return new Promise( (resolve, reject) => {

			let ec2 = new AWS.EC2();

			ec2.describeVolumes({}, (error, response) => {
				if (error) {
					reject(error);
				} else {

					// Map response object to volume objects
					let volumes = response.Volumes.map(volumeResponse => {
						let volume = {};

						// If the volume has no Name tag, use its id as the name instead
						volume.Name = volumeResponse.VolumeId;
						volume.VolumeId = volumeResponse.VolumeId;

						// Convert tags to properties on volume object
						volume.Tags = {};
						volumeResponse.Tags.map(tag => {
							volume.Tags[tag.Key] = tag.Value;
							if (tag.Key === 'Name') volume.Name = tag.Value;
						});

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
										Name: `[${parseInt(tuple[1])}|${parseInt(tuple[2])}]`,
										Frequency: parseInt(tuple[1]),
										Expiry: parseInt(tuple[2])
									});
								} else if (ALIASES.hasOwnProperty(backupType)) {
									volume.BackupConfig.BackupTypes.push({
										Name: backupType,
										Alias: backupType,
										Frequency: ALIASES[backupType][0],
										Expiry: ALIASES[backupType][1]
									});
								} else {
									warnings.push(`Volume ${prettyPrintVol(volume)}: Could not interpret backup type '${backupType}'. Please ensure the '${BACKUP_API_TAG}' tag is valid`);
								}
							});
							return volume;
						}
					).filter(volume => {
						// sanitise array of failed mappings
						if (!volume || !volume.VolumeId || !volume.Name) {
							warnings.push('Volume response from AWS could not be interpreted properly. It was mapped to:');
							warnings.push(volume);
							return false;
						} else if (!volume.BackupConfig || !volume.BackupConfig.BackupTypes || volume.BackupConfig.BackupTypes.length === 0) {
							warnings.push(`Volume ${prettyPrintVol(volume)}: Ignoring volume because its '${BACKUP_API_TAG}' tag could not be intepreted. Please check it is in a valid format.`);
							return false;
						}

						volume.BackupConfig.BackupTypes = volume.BackupConfig.BackupTypes.filter(type => {
							if (!type.Frequency || !type.Expiry) {
								warnings.push(`Volume ${prettyPrintVol(volume)}: Ignoring backup type '${type}'. Please check the volume's '${BACKUP_API_TAG}' tag is valid`);
								return false;
							}
							return true;
						});

						return true;
					});
					resolve({volumes, warnings});
				}
			});
		});
	}
}


export default EC2Store;
