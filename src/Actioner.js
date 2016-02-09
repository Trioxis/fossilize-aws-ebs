import AWS from 'aws-sdk';
AWS.config.update({region: 'ap-southeast-2'});
let ec2 = new AWS.EC2();

let promiseToPauseFor = (ms) => new Promise(resolve => {
	setTimeout(resolve, ms);
});

// Given an array of actions, perform the actions in AWS EC2
// These could be creating a snapshot from an EBS volume, or
// deleting an existing snapshot
let doActions = (actions) => {
	// let results = [];
	// let warnings = [];
	// let promises = Promise.resolve();

	return Promise.all(
		actions.map((action) => {
			switch (action.Action) {
				case 'SNAPSHOT_VOLUME':


					return makeBackupPromise(action);
				default:
					console.log(`Unknown action type ${action.Action}`);
					return Promise.resolve(null);

			}
		})
	);
};

let makeBackupPromise = (action) => {
	return makeSnapshotPromise(action)
	.catch(err => salvagePromise(err, action));
};

let makeSnapshotPromise = (action) => {
	return new Promise((resolve, reject) => {
		ec2.createSnapshot({ DryRun: false, VolumeId: action.VolumeId, Description: `${action.BackupType} omg`}, (err, res) => {
			if (err) reject(err);
			else {
				console.log(`Snapshotted ${action.VolumeName} for ${action.BackupType}`);
				resolve(res);
			}
		});
	});
};

let salvagePromise = (err, action) => {
	// Attempt to
	if (err.code === 'SnapshotCreationPerVolumeRateExceeded') {
		// Cannot create a snapshot on the same volume more than one every 15 seconds
		// Wait and try again
		return promiseToPauseFor(15000).then(() => makeBackupPromise(action));
	} else {
		console.log(`Error on ${action.BackupType}`);
		console.log(err);
		return Promise.reject(err);
	}
};


export {doActions};
