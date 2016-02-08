import EC2Store from './EC2Store';
import {findDeadSnapshots, matchSnapsToVolumes} from './Analyser';
import {makeDeleteAction, makeCreationActions} from './ActionCreator';
import {doActions} from './Actioner';

import * as printer from './printing';

export default function () {
	let collector = {
		warnings: [],
		stats: {
			snapshots: 0,
			orphanedSnaps: 0,
			volumes: 0,
			backupTypes: 0
		}
	};

	let ec2 = new EC2Store();

	return ec2.listSnapshots()
		.then(({snapshots, warnings}) => {
			printer.printSnaplist(snapshots);
			collector.stats.snapshots += snapshots.length;
			collector.warnings = collector.warnings.concat(warnings);

			let deadSnaps = findDeadSnapshots(snapshots);
			let cleanupActions = deadSnaps.map(snap => makeDeleteAction(snap));

			let creationActions = ec2.listEBS()
				.then(({volumes, warnings}) => {
					collector.stats.volumes += volumes.length;
					volumes.map((volume) => collector.stats.backupTypes += volume.BackupConfig.BackupTypes.length);
					collector.warnings = collector.warnings.concat(warnings);

					let {matchedVolumes, orphanedSnaps} = matchSnapsToVolumes(volumes, snapshots);
					collector.stats.orphanedSnaps += orphanedSnaps.length;

					let actions = [];
					matchedVolumes.map(volume => actions = actions.concat(makeCreationActions(volume)));
					printer.printEBSList(matchedVolumes);
					printer.printActions(actions);
					return actions;
				});

			return Promise.all([cleanupActions, creationActions])
				.then(actionsArray => actionsArray[0].concat(actionsArray[1]))
				.then(action => doActions(action))
				.then(() => {
					printer.printStatistics(collector.stats);
					printer.printWarnings(collector.warnings);
				});
		}).catch(err => {
			printer.printError(err);
			process.exit(1);
		});
}
