import moment from 'moment';

let headingLine = '-------------------------------------------------------------';

var printSnaplist = (snapshots) => {
	console.log('AWSBM Snapshots');
	console.log(headingLine);
	snapshots.map(snap => {
		console.log(`(${snap.SnapshotId}): '${snap.Name}'`);
		console.log(`           From: ${snap.FromVolumeName ? snap.FromVolumeName : 'UNKNOWN'}`);
		console.log(`           Type: ${snap.BackupType ? snap.BackupType : 'UNKNOWN'}`);
		console.log(`        Created: ${snap.StartTime.format("dddd, MMMM Do YYYY, h:mm:ss a (ZZ)")} - ${snap.StartTime.fromNow()}`);
		console.log(`        Expires: ${snap.ExpiryDate ? `${snap.ExpiryDate.format("dddd, MMMM Do YYYY, h:mm:ss a (ZZ)")} - ${snap.ExpiryDate.fromNow()}` : 'Never'}`);
		console.log();
	});
	console.log();
};

var printEBSList = (volumes) => {
	console.log('AWSBM Volumes');
	console.log(headingLine);
	volumes.map(vol => {
		console.log(`(${vol.VolumeId}): '${vol.Name}'`);
		let knownBackupTypes = [];
		vol.BackupConfig.BackupTypes.map(backup => {
			let name = `${backup.Alias ? `${backup.Alias}`: `[${backup.Frequency}|${backup.Expiry}]`}`;
			knownBackupTypes.push(name);
			let displayName = `${name} backup`;
			let frequencyDescriptor = `${moment.duration(backup.Frequency, 'hours').humanize().replace(/(a )|(an )/g, '')} for ${moment.duration(backup.Expiry, 'hours').humanize()}`;
			let maximumSnapsDescriptor = `${Math.floor(backup.Expiry/backup.Frequency)} backups at a time`;
			console.log(`        Backup: ${displayName} (every ${frequencyDescriptor})`);
			console.log(`                ${maximumSnapsDescriptor}`);
			// if (vol.Snapshots[name]) {}
			console.log(`                ${vol.Snapshots[name] ? vol.Snapshots[name].length : 0} backups currently exist`);
		});
		Object.keys(vol.Snapshots).map((backupType) => {
			if (knownBackupTypes.indexOf(backupType) === -1) {
				console.log(`        ${vol.Snapshots[backupType].length} backups of unknown type ${backupType}`);
			}
		});
		console.log();
	});
	console.log();
};

var printStatistics = (stats) => {
	console.log('AWSBM Statistics');
	console.log(headingLine);
	console.log(`${stats.snapshots} snapshots`);
	console.log(`   - ${stats.orphanedSnaps} snapshots with no associated volume`);
	console.log(`${stats.volumes} EBS volumes`);
	console.log(`   - ${stats.backupTypes} EBS volume backup types identified`);
	console.log();
};

var printWarnings = (warnings) => {
	if (warnings.length > 0) {
		console.warn(`${warnings.length} warnings`);
		console.warn(headingLine);
		warnings.map((warning) => console.warn(` - ${warning}`));
	}
};

var printError = (error) => {
	console.error();
	console.error('Error');
	console.error(headingLine);
	console.error(error.stack);
};

export {
	printSnaplist,
	printEBSList,
	printStatistics,
	printWarnings,
	printError
};
