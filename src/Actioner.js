import AWS from 'aws-sdk';
AWS.config.update({region: 'ap-southeast-2'});
let ec2 = new AWS.EC2();


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

let _promiseToPauseFor = (ms) => new Promise(resolve => {
	setTimeout(resolve, ms);
});

let makeBackup = (action) => {
	return _makeSnapshot(action)
		.then(snapshot => _tagSnapshot(snapshot, action))
		.catch(err => _salvageSnapshotPromise(err, action));
};

let _makeSnapshot = (action) => {
	console.log(`i Snapshotting ${action.VolumeName}-${action.BackupType}`);
	return new Promise((resolve, reject) => {
		ec2.createSnapshot({ DryRun: false, VolumeId: action.VolumeId, Description: `${action.BackupType} omg`}, (err, res) => {
			if (err) {
				console.log(`x Snapshotting ${action.VolumeName}-${action.BackupType} failed`);
				reject(err);
			} else {
				console.log(`o Snapshotting ${action.VolumeName}-${action.BackupType} complete`);
				resolve(res);
			}
		});
	});
};

let _tagSnapshot = (snapshot, action) => {
	let tags = [{
		Key: 'backups:config-v0',
		Value:
			`ExpiryDate:${action.ExpiryDate.utc().format('YYYYMMDDHHmmss')},` +
			`FromVolumeName:${action.VolumeName},` +
			`BackupType:${action.BackupType}`
	}, {
		Key: 'Name',
		Value: `${action.VolumeName}-${action.BackupType}`
	}];
	return new Promise((resolve, reject) => {
		console.log(`i Tagging ${action.VolumeName}-${action.BackupType}`);
		ec2.createTags({
			DryRun: false,
			Resources: [snapshot.SnapshotId],
			Tags: tags
		}, (err, response) => {
			if (err) {
				console.log(`x Tagging ${action.VolumeName}-${action.BackupType} failed`);
				reject(err);
			} else {
				console.log(`o Tagging ${action.VolumeName}-${action.BackupType} complete`);
				// All you get from createTags is an empty object, much more
				// useful to return what we were snapshotting
				if (response) snapshot.Tags = tags;
				resolve(snapshot);
			}
		});
	});
};

let _salvageSnapshotPromise = (err, action) => {
	// Attempt to fix whatever problems may have arisen
	if (err.code === 'SnapshotCreationPerVolumeRateExceeded') {
		// Cannot create a snapshot on the same volume more than one every 15 seconds
		// Wait and try again
		return _promiseToPauseFor(15000).then(() => makeBackup(action));
	} else {
		// I dunno how to fix this, just fail completely
		console.log(`x Action ${action.VolumeName}-${action.BackupType} failed`);
		console.log(`x ${err}`);
		return Promise.reject(err);
	}
};


export {doActions};
