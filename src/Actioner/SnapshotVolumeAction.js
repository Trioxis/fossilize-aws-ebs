import AWS from 'aws-sdk';
import moment from 'moment';
AWS.config.update({region: 'ap-southeast-2'});

import _promiseToPauseFor from './_promiseToPauseFor';

let makeBackup = (action) => {
	return _makeSnapshot(action)
		.then(snapshot => _tagSnapshot(snapshot, action))
		.catch(err => _salvageSnapshotPromise(err, action));
};

let _makeSnapshot = (action) => {
	let ec2 = new AWS.EC2();
	console.log(`i Snapshotting ${action.VolumeName}-${action.BackupType}`);
	return new Promise((resolve, reject) => {
		ec2.createSnapshot({
			VolumeId: action.VolumeId,
			Description: `AWSBM '${action.BackupType}' backup of volume '${action.VolumeName}' (${action.VolumeId})`
		}, (err, res) => {
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
	let ec2 = new AWS.EC2();
	let madeDate = moment().utc(snapshot.StartTime, 'ddd MMM DD YYYY HH:mm:ss ZZ');
	let tags = [{
		Key: 'backups:config-v0',
		Value:
			`ExpiryDate:${action.ExpiryDate.utc().format('YYYYMMDDHHmmss')},` +
			`FromVolumeName:${action.VolumeName},` +
			`BackupType:${action.BackupType}`
	}, {
		Key: 'Name',
		Value: `${action.VolumeName}-${action.BackupType}+${madeDate.utc().format('YYYYMMDDHHmmss')}`
	}];
	return new Promise((resolve, reject) => {
		console.log(`i Tagging ${action.VolumeName}-${action.BackupType}`);
		ec2.createTags({
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
		console.log('Pausing');
		return _promiseToPauseFor(15000).then(() => makeBackup(action));
	} else {
		// I dunno how to fix this, just fail completely
		console.log(`x Action ${action.VolumeName}-${action.BackupType} failed`);
		console.log(`x ${err}`);
		return Promise.reject(err);
	}
};

export {
	makeBackup,
	_makeSnapshot,
	_tagSnapshot,
	_salvageSnapshotPromise
};
