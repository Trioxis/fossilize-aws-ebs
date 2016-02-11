import sinon from 'sinon';
import moment from 'moment';
import expect from 'expect.js';

import {makeDeleteAction, makeCreationActions} from '../src/ActionCreator';

describe('ActionCreator', () => {
	let clock, sandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		clock = sandbox.useFakeTimers();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('makeDeleteAction', () => {
		it.skip('should create a deletion action for the given snapshot');
	});

	describe('makeCreationActions', () => {
		it('should return a list of creation actions for each backup type that doesn\'t have a recent backup', () => {
			let now = moment();
			let volume = {
				VolumeId: 'vol-abcdabcd',
				Name: 'volume-lol',
				BackupConfig: {
					BackupTypes: [
						{
							Name: 'Daily',
							Frequency: 24,
							Expiry: 168
						},
						{
							Name: 'Weekly',
							Frequency: 168,
							Expiry: 672
						}
					]
				},
				Snapshots: {
					Daily: [{
						Name: 'snapshot-lol',
						SnapshotId: 'snap-12341234',
						FromVolumeId: 'vol-abcdabcd',
						FromVolumeName: 'volume-lol',
						StartTime: moment(now).subtract(1, 'hours'),
						ExpiryDate: now,
						BackupType: 'Daily'
					}]
				}
			};

			let actions = makeCreationActions(volume);

			expect(actions).to.be.eql([
				{
					Action: 'SNAPSHOT_VOLUME',
					BackupType: 'Weekly',
					ExpiryDate: moment(now).add(672, 'hours'),
					VolumeId: 'vol-abcdabcd',
					VolumeName: 'volume-lol'
				}
			]);
		});
	});

	describe('determineBackupsNeeded', () => {
		it.skip('should return a list of backups needed for the given volume based on recentness of the snapshots in the snaphot list');
	});
});
