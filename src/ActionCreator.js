import moment from 'moment';

// Given a snapshot object, make an action that will delete the snapshots
// TODO: What format are actions in?
let makeDeleteAction = (snap) => {
	return { Action: 'DELETE_SNAPSHOT', SnapshotId: snap.SnapshotId};
};

// Given an EBS volume and a list of snapshots, return a list of actions
// to create the necessary snapshots that fulful the backup requirements
let makeCreationActions = (volume) => {
	let backupTypes = volume.BackupConfig.BackupTypes.filter(type => {
		let now = moment();
		if (!volume.Snapshots[type.Name] ||
				volume.Snapshots[type.Name].length <= 0 ||
				now.diff(volume.Snapshots[type.Name][0].StartTime, 'hours', true) > type.Frequency
		) {
			return true;
		} else {
			return false;
		}
	});

	return backupTypes.map((backup) => ({
		Action: 'SNAPSHOT_VOLUME',
		VolumeId: volume.VolumeId,
		VolumeName: volume.Name,
		BackupType: backup.Name,
		ExpiryDate: moment().add(backup.Expiry, 'hours')
	}));
};

// Read the tags on the EBS volume and check if the backup requirements are
// fulfilled by the current state of snapshots. For example: if the volume
// requires hourly and daily backups, do hourly and daily snapshots exist
// within the last hour and 24 hours respectively?
let determineBackupsNeeded = (volume, snapList) => {
	return [{volume, snapList}];
};

export {makeDeleteAction, makeCreationActions, determineBackupsNeeded};
