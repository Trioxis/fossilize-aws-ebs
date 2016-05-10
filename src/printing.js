import moment from 'moment';
import {log, logToCloudWatch} from './CloudWatchLogger';

let headingLine = '-------------------------------------------------------------';

var printSnaplist = (snapshots, verbose) => {
	if (verbose /* implement verbose flag later */) {
		log('Fossilize Backups');
		log(headingLine);
		if (snapshots.length === 0) {
			log('No snapshots with valid fossilize:config-v0 tag found');
		}
		snapshots.map(snap => {
			log(`(${snap.SnapshotId}): '${snap.Name}'`);
			log(`           From: ${snap.FromVolumeName ? snap.FromVolumeName : 'UNKNOWN'}`);
			log(`           Type: ${snap.BackupType ? snap.BackupType : 'UNKNOWN'}`);
			log(`        Created: ${snap.StartTime.format('dddd, MMMM Do YYYY, h:mm:ss a (ZZ)')} - ${snap.StartTime.fromNow()}`);
			log(`        Expires: ${snap.ExpiryDate ? `${snap.ExpiryDate.format('dddd, MMMM Do YYYY, h:mm:ss a (ZZ)')} - ${snap.ExpiryDate.fromNow()}` : 'Never'}`);
			log();
		});
	} else {
		log('Fossilize Backup Summary');
		log(headingLine);
		if (snapshots.length === 0) {
			log('No snapshots with valid fossilize:config-v0 tag found');
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
		log(`Volume  ` + spacing.slice(0, longestVolName - 6) +
			`Backup Types  ` + spacing.slice(0, longestBackupName - 12) +
			`Backups `
		);
		// log(`Volume      Backup Type      Backups`);
		for (let vol in snapSummary) {
			for (let type in snapSummary[vol]) {
				log(`${vol}  ${spacing.slice(0, longestVolName - vol.length)}` +
					`${type} ${spacing.slice(0, longestBackupName - type.length)} ${snapSummary[vol][type]}`);
			}
		}
	}
	log();
};

var printEBSList = (volumes) => {
	log('Fossilize Volumes');
	log(headingLine);
	if (volumes.length === 0) {
		log('No volumes with valid fossilize:config-v0 tag found');
	}
	volumes.map(vol => {
		log(`(${vol.VolumeId}): '${vol.Name}'`);
		let knownBackupTypes = [];
		vol.BackupConfig.BackupTypes.map(backup => {
			let name = `${backup.Name}`;
			knownBackupTypes.push(name);
			let frequencyDescriptor = `${moment.duration(backup.Frequency, 'hours').humanize().replace(/(a )|(an )/g, '')} for ${moment.duration(backup.Expiry, 'hours').humanize()}`;
			let maximumSnapsDescriptor = `${Math.floor(backup.Expiry/backup.Frequency)} backups at a time`;
			log(`        Backup: ${name} backup (every ${frequencyDescriptor})`);
			log(`                ${maximumSnapsDescriptor}`);
			log(`                ${vol.Snapshots[name] ? vol.Snapshots[name].length : 0} backups currently exist`);
			if (vol.Snapshots[name] && vol.Snapshots[name].length > 0) {
				log(`                Last backed up ${vol.Snapshots[name][0].StartTime.fromNow()}`);
			}
		});
		Object.keys(vol.Snapshots).map((backupType) => {
			if (knownBackupTypes.indexOf(backupType) === -1) {
				log(`        ${vol.Snapshots[backupType].length} snapshots of unknown backup type ${backupType}`);
			}
		});
		log();
	});
	log();
};

var printActions = (actions) => {
	log('Fossilize Actions');
	log(headingLine);
	if (actions.length === 0) {
		log('No actions are required');
	}
	actions.map((action) => {
		if (action.Action === 'SNAPSHOT_VOLUME') {
			log(`${action.Action}: (${action.VolumeId}) '${action.VolumeName}' ${action.BackupType} (Expires ${action.ExpiryDate.fromNow()})`);
		}
		if (action.Action === 'DELETE_SNAPSHOT') {
			log(`${action.Action}: ${action.SnapshotId}`);
		}
	});
	log();
};

var printStatistics = (stats) => {
	log('Fossilize Statistics');
	log(headingLine);
	log(`${stats.ec2Objects.snapshots} snapshots`);
	log(`   - ${stats.backups.expiredSnaps} snapshots that have expired`);
	log(`   - ${stats.backups.orphanedSnaps} snapshots with no associated volume`);
	log(`${stats.ec2Objects.volumes} EBS volumes`);
	log(`   - ${stats.backups.backupTypes} EBS volume backup types identified`);
	log(`${stats.actions.create + stats.actions.delete} actions attempted`);
	log(`   - ${stats.actions.create} create backup actions`);
	log(`   - ${stats.actions.delete} delete backup actions`);
	log();

	stats.timestamp = Date.now();
	return logToCloudWatch(stats).then(() => {
		log('Logged statistics to CloudWatch');
	}).catch((err) => {
		log('Error logging to CloudWatch:');
		log(err);
	});
};

var printWarnings = (warnings) => {
	if (warnings.length > 0) {
		log(`${warnings.length} warnings`);
		log(headingLine);
		warnings.map((warning) => log(` - ${warning}`));
	}
};

var printError = (error) => {
	log();
	log('Error');
	log(headingLine);
	log(error.stack);
};

export {
	printSnaplist,
	printEBSList,
	printActions,
	printStatistics,
	printWarnings,
	printError
};
