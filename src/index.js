import EC2Store from './EC2Store';
import {findDeadSnapshots} from './SnapshotAnalyser';
import {makeDeleteAction, makeCreationActions} from './ActionCreator';
import {doActions} from './Actioner';

export default function () {
	let ec2 = new EC2Store();

	return ec2.listSnapshots()
		.then(snapList => {
			let cleanupActions = snapList => {
				let deadSnaps = findDeadSnapshots(snapList);

				// Convert list of dead snapshots to list of cleanup actions
				return deadSnaps.map(snap => makeDeleteAction(snap));
			};

			let creationActions = snapList => {
				return ec2.listEBS()
					.then(ebsList => {
						return ebsList.map(volume => makeCreationActions(volume, snapList));
					});
			};

			return new Promise.all([cleanupActions(snapList), creationActions(snapList)])
				.then(actionsArray => actionsArray[0].concat(actionsArray[1]))
				.then(action => doActions(action));
		}).catch(err => console.log(err));
}
