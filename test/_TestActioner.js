import AWS from 'aws-sdk';
import expect from 'expect.js';
import sinon from 'sinon';
import moment from 'moment';

import ec2Responses from './fixtures/EC2Responses';

import {doActions, makeBackup} from '../src/Actioner';

describe('Actioner', () => {
	let sandbox, mockEC2, mockAWS;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockEC2 = {};
		mockAWS = sandbox.stub(AWS, 'EC2').returns(mockEC2);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('makeBackup', () => {
		it('should attempt to snapshot the volume in the action provided', () => {
			let action = {
				Action: 'SNAPSHOT_VOLUME',
				VolumeId: 'vol-1234abcd',
				VolumeName: 'a-volume',
				BackupType: 'Hourly',
				ExpiryDate: moment().add('24', 'hours')
			};

			mockEC2.createSnapshot = sinon.stub().yields(null, ec2Responses.snapshots1);
			mockEC2.createTags = sinon.stub().yields(null, ec2Responses.snapshots1);

			return makeBackup(action)
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
});
