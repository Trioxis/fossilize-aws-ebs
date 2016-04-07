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
			expiredSnaps: 0,
			volumes: 0,
			backupTypes: 0,
			actions: 0,
			createActions: 0,
			deleteActions: 0
		}
	};

	let ec2 = new EC2Store();

	return ec2.listSnapshots()
		.then(({snapshots, warnings}) => {
			printer.printSnaplist(snapshots);
			collector.stats.snapshots = snapshots.length;
			collector.warnings = collector.warnings.concat(warnings);

			let deadSnaps = findDeadSnapshots(snapshots);
			collector.stats.expiredSnaps = deadSnaps.length;
			let cleanupActions = deadSnaps.map(snap => makeDeleteAction(snap));
			collector.stats.deleteActions = cleanupActions.length;

			let creationActions = ec2.listEBS()
				.then(({volumes, warnings}) => {
					collector.stats.volumes = volumes.length;
					volumes.map((volume) => collector.stats.backupTypes += volume.BackupConfig.BackupTypes.length);
					collector.warnings = collector.warnings.concat(warnings);

					let {matchedVolumes, orphanedSnaps} = matchSnapsToVolumes(volumes, snapshots);
					collector.stats.orphanedSnaps = orphanedSnaps.length;
					printer.printEBSList(matchedVolumes);

					// this is necessary because makeCreationActions can return multiple actions per volume
					let actions = [];
					matchedVolumes.map(volume => actions = actions.concat(makeCreationActions(volume)));
					collector.stats.createActions = actions.length;
					return actions;
				});

			return Promise.all([cleanupActions, creationActions])
				.then(actionsArray => {
					let actions = actionsArray[0].concat(actionsArray[1]);
					printer.printActions(actions);
					collector.stats.actions = actions.length;
					return actions;
				})
				.then(action => {
					return doActions(action).then((results) => {
						if (results.length > 0 ) {
							console.log();
							console.log('Fossilize Action Outcomes');
							console.log('-------------------------------------------------------------');
						}
						results.map((result) => console.log(result));
						console.log();
						printer.printStatistics(collector.stats);
						printer.printWarnings(collector.warnings);
					});
				});

		}).catch(err => {
			printer.printError(err);
			process.exit(1);
		});
}
