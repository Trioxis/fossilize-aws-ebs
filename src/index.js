import EC2Store from './EC2Store';
import {findDeadSnapshots} from './SnapshotAnalyser';
import {makeDeleteAction, makeCreationActions} from './ActionCreator';
import {doActions} from './Actioner';

export default function () {
	let collector = {
		warnings: [],
		stats: {
			snapshots: 0,
			volumes: 0,
			backupTypes: 0
		}
	};

	let ec2 = new EC2Store();

	return ec2.listSnapshots()
		.then(({snapshots, warnings}) => {
			collector.stats.snapshots += snapshots.length;
			collector.warnings = collector.warnings.concat(warnings);
			let deadSnaps = findDeadSnapshots(snapshots);
			let cleanupActions = deadSnaps.map(snap => makeDeleteAction(snap));

			let creationActions = ec2.listEBS()
				.then(({volumes, warnings}) => {
					collector.stats.volumes += volumes.length;
					volumes.map((volume) => collector.stats.backupTypes += volume.BackupConfig.BackupTypes.length)
					collector.warnings = collector.warnings.concat(warnings);
					return volumes.map(volume => makeCreationActions(volume, snapshots));
				});

			return Promise.all([cleanupActions, creationActions])
				.then(actionsArray => actionsArray[0].concat(actionsArray[1]))
				.then(action => doActions(action))
				.then(() => {
					let headingLine = '-------------------------------------------------------------';
					console.log('AWSBM Statistics');
					console.log(headingLine);
					console.log(`${collector.stats.snapshots} snapshots`);
					console.log(`${collector.stats.volumes} EBS volumes`);
					console.log(`${collector.stats.backupTypes} volume backup types identified`);
					console.log();
					if (collector.warnings.length > 0) {
						console.warn(`${collector.warnings.length} warnings`);
						console.log(headingLine);
						collector.warnings.map((warning) => console.warn(` - ${warning}`));
					}
				});
		}).catch(err => console.error(err));
}
