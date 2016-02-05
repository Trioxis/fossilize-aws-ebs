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

// Given a list of EBS volumes and list of snapshots, matches each snapshot to the
// EBS's Snapshots[BackupType] array. Returns an object containing the volume list
// and a list of orphaned snapshots
let matchSnapsToVolumes = (volumes, snapList) => {
	let matchedVolumes = volumes.map((volume) => {
		volume.Snapshots = {};
		snapList = snapList.filter((snap) => {
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

// finds the most recently created snapshot in a list
let getLatestSnapshot = (snapList) => {
	// sort in to latest first
	snapList.sort((a, b) => {
		if (a.StartTime.isAfter(b)) {
			return -1;
		} else if (a.StartTime.isSame(b)) {
			return 0;
		} else {
			return 1;
		}
	});
	return snapList[0];
}

export {findDeadSnapshots, snapshotIsDead, matchSnapsToVolumes, getLatestSnapshot};
