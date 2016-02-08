// Given an array of actions, perform the actions in AWS EC2
// These could be creating a snapshot from an EBS volume, or
// deleting an existing snapshot
let doActions = (actions) => {
	let promises = [];
	let warnings = [];
	actions.map((action) => {
		switch (action.Action) {
			case 'SNAPSHOT_VOLUME':

				promises.push(createSnapshotPromise(action));
				break;
			default:
				warnings.push(`Unknow action type ${action.Action}`);
				break;
		}
	});


	return Promise.all(promises)
		.then(resolved => ({results: resolved, warnings: warnings}));
};

// Makes a promise that always resolves
let createSnapshotPromise = (action) => {
	return new Promise((resolve, reject) => {
		resolve(action);
		reject(action);
		// make snapshot and tag it
		// then, if all goes well, resolve with an action result that explains
		// the operation was successful
	}).catch((error) => {
		return error;
		// convert the promise in to an action result that explains the error
		// and return a resolved Promise
	});
};


export {doActions};
