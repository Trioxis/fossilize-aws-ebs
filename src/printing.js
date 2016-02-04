import moment from 'moment';

let headingLine = '-------------------------------------------------------------';

var printSnaplist = (snapshots) => {
	console.log('AWSBM Snapshots');
	console.log(headingLine);
	snapshots.map(snap => {
		console.log(`(${snap.SnapshotId}): '${snap.Name}'`);
		let _ =  snap.SnapshotId.replace(/./g, ' ') + '    ';
		console.log(`${_} Created: ${snap.StartTime}`);
		console.log(`${_} Expires: ${snap.ExpiryDate ? moment(snap.ExpiryDate, 'YYYYMMDDHHmmss').fromNow() : 'Never'}`);
	});
	console.log();
};

var printEBSList = (volumes) => {
	console.log('AWSBM Volumes');
	console.log(headingLine);
	volumes.map(vol => {
		console.log(`(${vol.VolumeId}): '${vol.Name}'`);
		let _ =  vol.VolumeId.replace(/./g, ' ') + '    ';
		vol.BackupConfig.BackupTypes.map(backup => {
			let name = `${backup.Alias ? `${backup.Alias} `: ''}backup`;
			let frequencyDescriptor = `${moment.duration(backup.Frequency, 'hours').humanize().replace(/(a )|(an )/g, '')} for ${moment.duration(backup.Expiry, 'hours').humanize()}`;
			let numberAtATime = `${Math.floor(backup.Expiry/backup.Frequency)} backups at a time`;
			console.log(`${_} Backup: ${numberAtATime} (${name} every ${frequencyDescriptor})`);
		});
	});
	console.log();
};

var printStatistics = (stats) => {
	console.log('AWSBM Statistics');
	console.log(headingLine);
	console.log(`${stats.snapshots} snapshots`);
	console.log(`${stats.volumes} EBS volumes`);
	console.log(`${stats.backupTypes} volume backup types identified`);
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
