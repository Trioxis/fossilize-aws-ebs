import AWS from 'aws-sdk';
import expect from 'expect.js';
import sinon from 'sinon';
import moment from 'moment';

import ec2Responses from './fixtures/EC2Responses';

import {doActions} from '../src/Actioner';
import * as SnapshotVolumeAction from '../src/Actioner/SnapshotVolumeAction';
import * as DeleteSnapshotAction from '../src/Actioner/DeleteSnapshotAction';
import _promiseToPauseFor from '../src/Actioner/_promiseToPauseFor';

describe('Actioner', () => {
	let sandbox, mocks, mockEC2, mockAWS, clock;

	beforeEach(() => {
		mocks = {}
		sandbox = sinon.sandbox.create();
		mockEC2 = {};
		mockAWS = sandbox.stub(AWS, 'EC2').returns(mockEC2);
		clock = sandbox.useFakeTimers();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('doActions', () => {
		it('should return promises for each action it is given, even if it can\'t do the action', () => {
			mocks.makeBackup = sandbox.stub(SnapshotVolumeAction, 'makeBackup', () => {
				return Promise.resolve({});
			});
			mocks.deleteSnapshot = sandbox.stub(DeleteSnapshotAction, 'deleteSnapshot', () => {
				return Promise.resolve({});
			});

			let actions = [{
				Action: 'SNAPSHOT_VOLUME',
			}, {
				Action: 'DELETE_SNAPSHOT'
			}, {
				Action: 'BOGUS_ACTION'
			}];

			return doActions(actions)
				.then((outcomes) => {
					expect(mocks.makeBackup.called).to.be.ok();
					expect(mocks.deleteSnapshot.called).to.be.ok();
					expect(outcomes[2]).to.be.eql({outcome: 'The Actioner does not know how to perform the action \'BOGUS_ACTION\''});
				}
			);

		});
	});

	describe('deleteSnapshot', () => {
		it('should delete the snapshot by the resource id given', () => {
			let action = {
				Action: 'DELETE_SNAPSHOT',
				SnapshotId: 'snap-abcd1234'
			};

			mockEC2.deleteSnapshot = sandbox.stub()
			mockEC2.deleteSnapshot.yields(null, {})

			return DeleteSnapshotAction.deleteSnapshot(action)
				.then((outcome) => {
					expect(mockEC2.deleteSnapshot.called).to.be.ok();
					expect(mockEC2.deleteSnapshot.args[0][0]).to.be.eql({
						SnapshotId: 'snap-abcd1234'
					});
					expect(outcome).to.be.eql({outcome: 'DELETE_SUCCESSFUL', SnapshotId: 'snap-abcd1234'});
			});
		});

		it('should pass the error object on if there is an error while deleting', () => {
			let action = {
				Action: 'DELETE_SNAPSHOT',
				SnapshotId: 'snap-abcd1234'
			};

			mockEC2.deleteSnapshot = sandbox.stub()
			mockEC2.deleteSnapshot.yields({message: 'Something went wrong', code: 'SnapshotDeletionError'}, null);

			return DeleteSnapshotAction.deleteSnapshot(action)
				.then((outcome) => {
					expect(outcome).to.be.eql({message: 'Something went wrong', code: 'SnapshotDeletionError'});
			});

		});
	});

	describe('_makeSnapshot', () => {
		it('should attempt to snapshot the volume in the action provided', () => {
			let action = {
				Action: 'SNAPSHOT_VOLUME',
				VolumeId: 'vol-1234abcd',
				VolumeName: 'a-volume',
				BackupType: 'Hourly',
				ExpiryDate: moment().add('24', 'hours')
			};

			mockEC2.createSnapshot = sandbox.stub().yields(null, {SnapshotId: 'snap-abcd1234'});

			return SnapshotVolumeAction._makeSnapshot(action)
				.then(() => {
					expect(mockEC2.createSnapshot.called).to.be.ok();
					expect(mockEC2.createSnapshot.args[0][0]).to.eql({
						VolumeId: 'vol-1234abcd',
						Description: `AWSBM 'Hourly' backup of volume 'a-volume' (vol-1234abcd)`
					});
					return;
				});
		});
	});

	describe('_tagSnapshot', () => {
		it('should tag the given snapshot appropriately based on the action it is given', () => {
			let action = {
				Action: 'SNAPSHOT_VOLUME',
				VolumeId: 'vol-1234abcd',
				VolumeName: 'a-volume',
				BackupType: 'Hourly',
				ExpiryDate: moment().add('24', 'hours')
			};
			let snapshot = {
				SnapshotId: 'snap-abcd1234',
		    VolumeId: 'vol-1234abcd',
		    State: 'pending',
		    StartTime: 'Thu Jan 09 1970 10:41:37 GMT+1100 (AEDT)',
		    Progress: '',
		    OwnerId: '123456789',
		    Description: 'AWSBM \'Hourly\' backup of volume \'a-volume\' (vol-1234abcd)',
		    VolumeSize: 80,
			};

			mockEC2.createTags = sandbox.stub().yields(null, {});

			return SnapshotVolumeAction._tagSnapshot(snapshot, action)
				.then(() => {
					expect(mockEC2.createTags.called).to.be.ok();
					expect(mockEC2.createTags.args[0][0]).to.eql({
						Resources: [
							'snap-abcd1234'
						],
						Tags: [{
							Key: 'backups:config-v0',
							Value: 'ExpiryDate:19700102000000,FromVolumeName:a-volume,BackupType:Hourly'
						}, {
							Key: 'Name',
							Value: 'a-volume-Hourly+19700108234137'
						}]
					});
					return;
				});
		});
	});

	describe('_promiseToPauseFor', () => {
		it('should wait the given amount of time before resolving', () => {
			let promise = _promiseToPauseFor(2001);
			// Longer than mocha's default timeout
			// This test isn't really a fair test

			clock.tick(2001);

			return promise.then(() => {
				return;
			});
		});
	});

	describe('makeBackup', () => {
		it.skip('should retry after 15 seconds if a SnapshotCreationPerVolumeRateExceeded error is returned', () => {
			let action = {
				Action: 'SNAPSHOT_VOLUME',
				VolumeId: 'vol-1234abcd',
				VolumeName: 'a-volume',
				BackupType: 'Hourly',
				ExpiryDate: moment().add('24', 'hours')
			};

			mockEC2.createSnapshot = sandbox.stub()
			mockEC2.createSnapshot.yields(null, {SnapshotId: 'yey'})
			mockEC2.createSnapshot.onFirstCall().yields({
				message: 'The maximum per volume CreateSnapshot request rate has been exceeded. Use an increasing or variable sleep interval between requests.',
				code: 'SnapshotCreationPerVolumeRateExceeded',
				time: 'Thu Feb 11 2016 10:41:37 GMT+1100 (AEDT)',
				requestId: '8b0b0101-9848-4d80-b012-ef16c4347182',
				statusCode: 400,
				retryable: false,
				retryDelay: 30
			}, null)
			.onSecondCall().yields(null, {
				SnapshotId: "lol"
			});

			mockEC2.createTags = sandbox.stub().onFirstCall().yields({});

			// mocks._promiseToPauseFor = sandbox.stub(actioner, '_promiseToPauseFor').returns(Promise.resolve());

			let backupPromise = SnapshotVolumeAction.makeBackup(action);


			return backupPromise.then(() => {
				expect
				return;
			});

		});
	});
});
