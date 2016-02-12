import moment from 'moment';

// Given a list of snapshots, returns a list of snapshots that have expired
// This can be determined using ExpiryDate tags
let findDeadSnapshots = (snapshotList) => {
	return snapshotList.filter((snap) => {
		if (moment().isAfter(snap.ExpiryDate)) {
			return true;
		} else {
			return false;
		}
	});
};

// Given a list of EBS volumes and list of snapshots, matches each snapshot to the
// EBS's Snapshots[BackupType] array. Returns an object containing the volume list
// and a list of orphaned snapshots
// The snapshot arrays are sorted by latest first
let matchSnapsToVolumes = (volumes, snapList) => {
	snapList = sortSnapsByMostRecent(snapList);
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

// Sorts a list of snapshots by most recently created first
let sortSnapsByMostRecent = (snapList) => {
	// sort in to latest first
	return snapList.sort((a, b) => {
		if (a.StartTime.isAfter(b.StartTime)) {
			return -1;
		} else if (a.StartTime.isSame(b.StartTime)) {
			return 0;
		} else {
			return 1;
		}
	});
};

export {findDeadSnapshots, matchSnapsToVolumes, sortSnapsByMostRecent};
