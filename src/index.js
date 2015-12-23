import EC2Store from './EC2Store';
import {findDeadSnapshots} from './SnapshotAnalyser';
import {makeDeleteAction} from './ActionCreator';

export default function () {
	let ec2 = new EC2Store();

	return ec2.listSnapshots()
		.then(snapList => {
			let cleanupActions = snapList => {
				let deadSnaps = findDeadSnapshots(snapList);

				return generateCleanupActions(deadSnaps => {
					deadSnaps.map(snap => makeDeleteAction(snap));
				});
			};

			let creationActions = snapList => {
				return ec2.listEBS()
					.then(ebsList => listBackupActionsNeeded(ebsList, snapList))
			};

			return new Promise.all([cleanupActions(snapList), creationActions(snapList)])
				.then(actionsArray => actionsArray[0].concat(actionsArray[1]))
				.then(action => doActions(actions));
	}).catch(err => console.log(err));
};
