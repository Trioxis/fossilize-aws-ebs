// Given a list of snapshots, returns a list of snapshots that have expired
// This can be determined using ExpiryDate tags
let findDeadSnapshots = (snapshotList) => {
	return [snapshotList];
};

// Helper function that checks if a single snapshot has expired or not.
// Returns true if the snapshot has expired and needs to be deleted.
let snapshotIsDead = (snapshot) => {
	return snapshot;
};

// Given a list of EBS volumes and list of snapshots, attaches the snapshot to the
// EBS's Snapshots[BackupType] array. Returns an object containing the volume list
// and a list of orphaned snapshots
var matchSnapsToVolumes = (volumes, snapList) => {

	let matchedVolumes = volumes.map((volume) => {
		volume.Snapshots = {};
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
};


export {findDeadSnapshots, snapshotIsDead, matchSnapsToVolumes};
