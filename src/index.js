import EC2Store from './EC2Store';
import {findDeadSnapshots, matchSnapsToVolumes} from './Analyser';
import {makeDeleteAction, makeCreationActions} from './ActionCreator';
import {doActions} from './Actioner';

import * as printer from './printing';

export default function () {
	let collector = {
		warnings: [],
		stats: {
			ec2Objects: {
				snapshots: 0,
				volumes: 0
			},
			backups: {
				backupTypes: 0,
				expiredSnaps: 0,
				orphanedSnaps: 0
			},
			actions: {
				create: 0,
				delete: 0,
				created: [],
				deleted: [],
			}
		}
	};

	let ec2 = new EC2Store();

	return ec2.listSnapshots()
		.then(({snapshots, warnings}) => {
			printer.printSnaplist(snapshots);
			collector.stats.ec2Objects.snapshots = snapshots.length;
			collector.warnings = collector.warnings.concat(warnings);

			let deadSnaps = findDeadSnapshots(snapshots);
			collector.stats.backups.expiredSnaps = deadSnaps.length;
			let cleanupActions = deadSnaps.map(snap => makeDeleteAction(snap));
			collector.stats.actions.delete = cleanupActions.length;

			let creationActions = ec2.listEBS()
				.then(({volumes, warnings}) => {
					collector.stats.ec2Objects.volumes = volumes.length;
					volumes.map((volume) => collector.stats.backups.backupTypes += volume.BackupConfig.BackupTypes.length);
					collector.warnings = collector.warnings.concat(warnings);

					let {matchedVolumes, orphanedSnaps} = matchSnapsToVolumes(volumes, snapshots);
					collector.stats.backups.orphanedSnaps = orphanedSnaps.length;
					printer.printEBSList(matchedVolumes);

					// this is necessary because makeCreationActions can return multiple actions per volume
					let actions = [];
					matchedVolumes.map(volume => actions = actions.concat(makeCreationActions(volume)));
					collector.stats.actions.create = actions.length;
					return actions;
				});

			return Promise.all([cleanupActions, creationActions])
				.then(actionsArray => {
					let actions = actionsArray[0].concat(actionsArray[1]);
					printer.printActions(actions);
					return actions;
				})
				.then(action => {
					return doActions(action).then((results) => {
						if (results.length > 0 ) {
							console.log();
							console.log('AWSBM Action Outcomes');
							console.log('-------------------------------------------------------------');
						}
						results.map((result) => {
							console.log(result);
							if (result.outcome === 'SNAPSHOT_SUCCESSFUL') collector.stats.actions.created.push(`${result.SnapshotId} - ${result.BackupType}`);
							if (result.outcome === 'DELETE_SUCCESSFUL') collector.stats.actions.deleted.push(result.SnapshotId);
						});
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
