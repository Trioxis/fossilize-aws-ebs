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

export {findDeadSnapshots, snapshotIsDead};
