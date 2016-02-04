// Given a snapshot object, make an action that will delete the snapshots
// TODO: What format are actions in?
let makeDeleteAction = (snap) => {
	return {snap};
};

// Given an EBS volume and a list of snapshots, return a list of actions
// to create the necessary snapshots that fulful the backup requirements
let makeCreationActions = (volume, snapList) => {
	// volume = attachSnapsToVolume(volume, snapList);

	console.log(`(${volume.VolumeId}): '${volume.Name}' has ${volume.Snapshots} related snapshots`);
	return determineBackupsNeeded(volume, snapList).map(backup => backup);
};

// Given a list of EBS volumes and list of snapshots, attaches the snapshot to the
// EBS's Snapshots[BackupType] array. Returns an object containing the volume list
// and a list of orphaned snapshots
var matchSnapsToVolumes = (volumes, snapList) => {

	let matchedVolumes = volumes.map((volume) => {
		volume.Snapshots = {}
		snapList = snapList.filter((snap) => {
			// console.log(snap);
			if (snap.FromVolumeName === volume.Name) {
				if (!volume.Snapshots[snap.BackupType]) volume.Snapshots[snap.BackupType] = [];
				volume.Snapshots[snap.BackupType].push(snap);
				return false;
			} else {
				return true;
			}
		});
		return volume;

	});

	let orphanedSnaps = snapList;
	return {matchedVolumes, orphanedSnaps};
}

// Read the tags on the EBS volume and check if the backup requirements are
// fulfilled by the current state of snapshots. For example: if the volume
// requires hourly and daily backups, do hourly and daily snapshots exist
// within the last hour and 24 hours respectively?
let determineBackupsNeeded = (volume, snapList) => {
	return [{volume, snapList}];
};

export {makeDeleteAction, matchSnapsToVolumes, makeCreationActions, determineBackupsNeeded};
