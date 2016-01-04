import expect from 'expect.js';
import sinon from 'sinon';

import EC2Store from '../src/EC2Store';
import AWS from 'aws-sdk';

describe('EC2Store', () => {
	describe('listSnapshots', () => {
		let sandbox, ec2Store, mockEC2, mockAWS;

		let ec2Responses = {
			snapshots1: {
				Snapshots: [{
					SnapshotId: 'snap-6c9f5062',
					VolumeId: 'vol-b77cff7d',
					State: 'completed',
					StartTime: 'Sun Dec 27 2015 00:19:31 GMT+1100 (AEDT)',
					Progress: '100%',
					OwnerId: '791606823516',
					Description: 'Created by CreateImage(i-aab1ce75) for ami-bb0953d8 from vol-b77cff7d',
					VolumeSize: 50,
					Tags: [],
					Encrypted: false
				}, {
					SnapshotId: 'snap-d9d374d7',
					VolumeId: 'vol-0a8631c0',
					State: 'completed',
					StartTime: 'Sat Jan 02 2016 06:58:55 GMT+1100 (AEDT)',
					Progress: '100%',
					OwnerId: '791606823516',
					Description: 'Daily backup of frg-web-xvdf',
					VolumeSize: 20,
					Tags: [ { Key: 'Name', Value: 'frg-web-xvdf-backup-2015-05-27-11-20' },
						{ Key: 'BackupTime', Value: '2015-05-27-11-20' },
						{ Key: 'BackupType', Value: 'Monthly' } ],
					Encrypted: false
				}]
			}
		};

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
			ec2Store = new EC2Store();
			mockEC2 = {};
			mockAWS = sandbox.stub(AWS, 'EC2').returns(mockEC2);
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should ask AWS EC2 for a list of all snapshots', () => {
			mockEC2.describeSnapshots = sinon.stub().yields(null, ec2Responses.snapshots1);

			return ec2Store.listSnapshots()
				.then(snapList => {
					expect(mockEC2.describeSnapshots.called).to.be.ok();
					return;
				});
		});
		it.skip('should return a Promise that resolves to an array of EC2 snapshots');
		it.skip('should filter snapshots so that only snapshots owned by us ... something')
	});

	describe('listEBS', () => {
		it.skip('should ask AWS EC2 for a list of all EBS volumes');
		it.skip('should return a Promise that resolves to an arrat of EBS volumes');
	});
});
