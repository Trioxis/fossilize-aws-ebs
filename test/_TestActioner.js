import AWS from 'aws-sdk';
import expect from 'expect.js';
import sinon from 'sinon';
import moment from 'moment';

import ec2Responses from './fixtures/EC2Responses';

import * as actioner from '../src/Actioner';

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

			return actioner._makeSnapshot(action)
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
		    StartTime: 'Thu Feb 11 2016 10:41:37 GMT+1100 (AEDT)',
		    Progress: '',
		    OwnerId: '123456789',
		    Description: 'AWSBM \'Hourly\' backup of volume \'a-volume\' (vol-1234abcd)',
		    VolumeSize: 80,
			};

			mockEC2.createTags = sandbox.stub().yields(null, {});

			return actioner._tagSnapshot(snapshot, action)
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
							Value: 'a-volume-Hourly'
						}]
					});
					return;
				});
		});
	});

});

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
	}, null);



	mocks._promiseToPauseFor = sandbox.stub(actioner, '_promiseToPauseFor').returns(Promise.resolve());

	return actioner.makeBackup(action)
	.then(() => {
		expect
		return;
	})
});
