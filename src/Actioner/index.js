import * as SnapshotVolume from './SnapshotVolumeAction';

// Given an array of actions, perform the actions in AWS EC2
// These could be creating a snapshot from an EBS volume, or
// deleting an existing snapshot
let doActions = (actions) => {
	// let results = [];
	// let warnings = [];
	// let promises = Promise.resolve();

	console.log(`i ${actions.length} actions to do`);

	return Promise.all(
		actions.map((action) => {
			switch (action.Action) {
				case 'SNAPSHOT_VOLUME':
					return makeBackup(action);
				default:
					console.log(`x Unknown action type ${action.Action}`);
					return Promise.resolve(null);

			}
		})
	);
};


export {
	doActions,
};
