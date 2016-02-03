// Given a snapshot object, make an action that will delete the snapshots
// TODO: What format are actions in?
let makeDeleteAction = (snap) => {
	return {snap};
};

// Given an EBS volume and a list of snapshots, return a list of actions
// to create the necessary snapshots that fulful the backup requirements
let makeCreationActions = (volume, snapList) => {

	return determineBackupsNeeded(volume, snapList).map(backup => backup);
};

// Read the tags on the EBS volume and check if the backup requirements are
// fulfilled by the current state of snapshots. For example: if the volume
// requires hourly and daily backups, do hourly and daily snapshots exist
// within the last hour and 24 hours respectively?
let determineBackupsNeeded = (volume, snapList) => {
	return [{volume, snapList}];
};

export {makeDeleteAction, makeCreationActions, determineBackupsNeeded};
