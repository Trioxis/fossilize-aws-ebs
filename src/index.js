import EC2Store from './EC2Store';
import {findDeadSnapshots} from './SnapshotAnalyser';

export default function () {
	let ec2 = new EC2Store();

	return ec2.listSnapshots()
		.then(snapList => {
			let cleanupActions = snapList => {
				let deadSnaps = function filterDeadSnaps (snapList) {
					return snapList.filter(snap => isDead(snap));
				};

				return generateCleanupActions(deadSnaps => {
					deadSnaps.map(snap => cleanUpAction(snap))
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
