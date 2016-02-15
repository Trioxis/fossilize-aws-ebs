import moment from 'moment';
import {logToCloudWatch} from './CloudWatchLogger';


let headingLine = '-------------------------------------------------------------';

var printSnaplist = (snapshots, verbose) => {
	if (verbose /* implement verbose flag later */) {
		console.log('AWSBM Backups');
		console.log(headingLine);
		if (snapshots.length === 0) {
			console.log('No snapshots with valid backups:config-v0 tag found');
		}
		snapshots.map(snap => {
			console.log(`(${snap.SnapshotId}): '${snap.Name}'`);
			console.log(`           From: ${snap.FromVolumeName ? snap.FromVolumeName : 'UNKNOWN'}`);
			console.log(`           Type: ${snap.BackupType ? snap.BackupType : 'UNKNOWN'}`);
			console.log(`        Created: ${snap.StartTime.format('dddd, MMMM Do YYYY, h:mm:ss a (ZZ)')} - ${snap.StartTime.fromNow()}`);
			console.log(`        Expires: ${snap.ExpiryDate ? `${snap.ExpiryDate.format('dddd, MMMM Do YYYY, h:mm:ss a (ZZ)')} - ${snap.ExpiryDate.fromNow()}` : 'Never'}`);
			console.log();
		});
	} else {
		console.log('AWSBM Backup Summary');
		console.log(headingLine);
		if (snapshots.length === 0) {
			console.log('No snapshots with valid backups:config-v0 tag found');
		}
		let snapSummary = {};
		let longestVolName = 9;
		let longestBackupName = 16;
		snapshots.map((snap) => {
			let volume = snap.FromVolumeName ? snap.FromVolumeName : '<Unknown Volume>';
			longestVolName = longestVolName > volume.length ? longestVolName : volume.length;
			if (!snapSummary[volume]) snapSummary[volume] = {};
			let type = snap.BackupType ? snap.BackupType : '<Unknown Backup Type>';
			longestBackupName = longestBackupName > type.length ? longestBackupName : type.length;
			if (!snapSummary[volume][type]) snapSummary[volume][type] = 0;
			snapSummary[volume][type]++;
		});
		let spacing = '                                                            ';
		console.log(`Volume  ` + spacing.slice(0, longestVolName - 6) +
			`Backup Types  ` + spacing.slice(0, longestBackupName - 12) +
			`Backups `
		);
		// console.log(`Volume      Backup Type      Backups`);
		for (let vol in snapSummary) {
			for (let type in snapSummary[vol]) {
				console.log(`${vol}  ${spacing.slice(0, longestVolName - vol.length)}` +
					`${type} ${spacing.slice(0, longestBackupName - type.length)} ${snapSummary[vol][type]}`);
			}
		}
	}
	console.log();
};

var printEBSList = (volumes) => {
	console.log('AWSBM Volumes');
	console.log(headingLine);
	if (volumes.length === 0) {
		console.log('No volumes with valid backups:config-v0 tag found');
	}
	volumes.map(vol => {
		console.log(`(${vol.VolumeId}): '${vol.Name}'`);
		let knownBackupTypes = [];
		vol.BackupConfig.BackupTypes.map(backup => {
			let name = `${backup.Name}`;
			knownBackupTypes.push(name);
			let frequencyDescriptor = `${moment.duration(backup.Frequency, 'hours').humanize().replace(/(a )|(an )/g, '')} for ${moment.duration(backup.Expiry, 'hours').humanize()}`;
			let maximumSnapsDescriptor = `${Math.floor(backup.Expiry/backup.Frequency)} backups at a time`;
			console.log(`        Backup: ${name} backup (every ${frequencyDescriptor})`);
			console.log(`                ${maximumSnapsDescriptor}`);
			console.log(`                ${vol.Snapshots[name] ? vol.Snapshots[name].length : 0} backups currently exist`);
			if (vol.Snapshots[name] && vol.Snapshots[name].length > 0) {
				console.log(`                Last backed up ${vol.Snapshots[name][0].StartTime.fromNow()}`);
			}
		});
		Object.keys(vol.Snapshots).map((backupType) => {
			if (knownBackupTypes.indexOf(backupType) === -1) {
				console.log(`        ${vol.Snapshots[backupType].length} snapshots of unknown backup type ${backupType}`);
			}
		});
		console.log();
	});
	console.log();
};

var printActions = (actions) => {
	console.log('AWSBM Actions');
	console.log(headingLine);
	if (actions.length === 0) {
		console.log('No actions are required');
	}
	actions.map((action) => {
		if (action.Action === 'SNAPSHOT_VOLUME') {
			console.log(`${action.Action}: (${action.VolumeId}) '${action.VolumeName}' ${action.BackupType} (Expires ${action.ExpiryDate.fromNow()})`);
		}
		if (action.Action === 'DELETE_SNAPSHOT') {
			console.log(`${action.Action}: ${action.SnapshotId}`);
		}
	});
	console.log();
};

var printStatistics = (stats) => {
	console.log('AWSBM Statistics');
	console.log(headingLine);
	console.log(`${stats.ec2Objects.snapshots} snapshots`);
	console.log(`   - ${stats.backups.expiredSnaps} snapshots that have expired`);
	console.log(`   - ${stats.backups.orphanedSnaps} snapshots with no associated volume`);
	console.log(`${stats.ec2Objects.volumes} EBS volumes`);
	console.log(`   - ${stats.backups.backupTypes} EBS volume backup types identified`);
	console.log(`${stats.actions.create + stats.actions.delete} actions attempted`);
	console.log(`   - ${stats.actions.create} create backup actions`);
	console.log(`   - ${stats.actions.delete} delete backup actions`);
	console.log();

	stats.timestamp = Date.now();
	logToCloudWatch(stats).then(() => {
		console.log('Logged statistics to CloudWatch');
	}).catch((err) => {
		console.error('Error logging to CloudWatch:');
		console.error(err);
	});
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
	printActions,
	printStatistics,
	printWarnings,
	printError
};
