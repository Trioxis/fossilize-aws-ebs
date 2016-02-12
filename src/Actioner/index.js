import * as SnapshotVolume from './SnapshotVolumeAction';
import * as DeleteSnapshot from './DeleteSnapshotAction';

// Given an array of actions, perform the actions in AWS EC2
// These could be creating a snapshot from an EBS volume, or
// deleting an existing snapshot
let doActions = (actions) => {
	console.log('Performing actions, please wait');
	console.log('-------------------------------------------------------------');

	console.log(`i ${actions.length} actions to do`);

	return Promise.all(
		actions.map((action) => {
			switch (action.Action) {
				case 'SNAPSHOT_VOLUME':
					return SnapshotVolume.makeBackup(action);
				case 'DELETE_SNAPSHOT':
					return DeleteSnapshot.deleteSnapshot(action);
				default:
					console.log(`x Unknown action type ${action.Action}`);
					return Promise.resolve({outcome: `The Actioner does not know how to perform the action '${action.Action}'`});

			}
		})
	);
};


export {
	doActions
};
