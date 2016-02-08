import sinon from 'sinon';
import expect from 'expect.js';
import moment from 'moment';

import {matchSnapsToVolumes, sortSnapsByMostRecent} from '../src/Analyser';

describe('matchSnapsToVolumes', () => {
	it('should attach some snapshots to volumes if their FromVolumeName and Name are the same', () => {
		let now = moment();
		let nowString = moment().format();
		let {matchedVolumes, orphanedSnaps} = matchSnapsToVolumes(
			[{
				VolumeId: 'vol-abcdabcd',
				Name: 'volume-lol',
				BackupConfig: {
					BackupTypes: [
						{
							Name: 'Daily',
							Frequency: 24,
							Expiry: 168
						}
					]
				}
			}],
			[{
				Name: 'snapshot-lol',
				SnapshotId: 'snap-12341234',
				FromVolumeId: 'vol-abcdabcd',
				FromVolumeName: 'volume-lol',
				StartTime: now,
				ExpiryDate: now,
				BackupType: 'Daily'
			}]
		);

		expect(matchedVolumes).to.be.eql([{
			VolumeId: 'vol-abcdabcd',
			Name: 'volume-lol',
			BackupConfig: {
				BackupTypes: [
					{
						Name: 'Daily',
						Frequency: 24,
						Expiry: 168
					}
				]
			},
			Snapshots: {
				Daily: [{
					Name: 'snapshot-lol',
					SnapshotId: 'snap-12341234',
					FromVolumeId: 'vol-abcdabcd',
					FromVolumeName: 'volume-lol',
					StartTime: now,
					ExpiryDate: now,
					BackupType: 'Daily'
				}]
			}
		}])
	});
});
