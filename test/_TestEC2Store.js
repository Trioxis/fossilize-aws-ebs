import expect from 'expect.js';
import sinon from 'sinon';

import EC2Store from '../src/EC2Store';
import AWS from 'aws-sdk';

import ec2Responses from './fixtures/EC2Responses';

describe('EC2Store', () => {
	let sandbox, ec2Store, mockEC2, mockAWS;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		ec2Store = new EC2Store();
		mockEC2 = {};
		mockAWS = sandbox.stub(AWS, 'EC2').returns(mockEC2);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('listSnapshots', () => {
		it('should ask AWS EC2 for a list of all snapshots', () => {
			mockEC2.describeSnapshots = sinon.stub().yields(null, ec2Responses.snapshots1);

			return ec2Store.listSnapshots()
				.then(snapList => {
					expect(mockEC2.describeSnapshots.called).to.be.ok();
					return;
				});
		});

		it('should return a Promise that resolves to an array of EC2 snapshots', () => {
			mockEC2.describeSnapshots = sinon.stub().yields(null, ec2Responses.snapshots1);

			let snapListPromise = ec2Store.listSnapshots();

			expect(snapListPromise).to.be.a(Promise);
			return snapListPromise.then(snapList => {
				expect(snapList).to.be.an(Array);
				return;
			})
		});

		it.skip('should only return snapshots that have the `backups:config-v0` tag');

		it.skip('should map the response to an array of objects that each represent a snapshot', () => {
			// This means converting the Name and backups:config tags to properties
			// and removing all other unnecessary properties

			// Response contains one snapshot so we can easily check that mapping is correct
			let singleSnap = ec2Responses.snapshots1.Snapshots[1];
			mockEC2.describeSnapshots = sinon.stub().yields(null, {Snapshots: [ singleSnap ]});

			return ec2Store.listSnapshots()
				.then(snapList => {
					expect(snapList.length).to.be(1);
					snapList.map((snapshot) => {
						expect(snapshot).to.eql({
							SnapshotId: singleSnap.SnapshotId,
							StartTime: singleSnap.StartTime,
							Name: singleSnap.Tags[0].Value,
							ExpiryDate: 201505271120
						});
					});
					return;
				});
		});
	});

	describe('listEBS', () => {
		it.skip('should ask AWS EC2 for a list of all EBS volumes', () => {
			mockEC2.describeVolumes = sinon.stub().yields(null, ec2Responses.volumes1);

			return ec2Store.listEBS()
				.then(volumeList => {
					expect(mockEC2.describeVolumes.called).to.be.ok();
					return;
				});
		});

		it.skip('should return a Promise that resolves to an array of EBS volumes', () => {
			mockEC2.describeVolumes = sinon.stub().yields(null, ec2Responses.volumes1);
			let volListPromise = ec2Store.listEBS();

			expect(volListPromise).to.be.a(Promise);
			return volListPromise.then(volList => {
				expect(volList).to.be.an(Array);
				expect(volList.length).to.not.be(0);
				return;
			})
		});

		it.skip('should map the response to an array of objects that each represent an EBS volume', () => {
			// This means converting the Name and backups:config tags to properties
			// and removing all other unnecessary properties

			// Response contains one snapshot so we can easily check that mapping is correct
			let singleVol = ec2Responses.volumes1.Volumes[1];
			mockEC2.describeVolumes = sinon.stub().yields(null, {Volumes: [singleVol]});

			return ec2Store.listEBS()
				.then(volList => {
					expect(volList.length).to.be(1);
					volList.map((volume) => {
						expect(volume).to.eql({
							VolumeId: singleVol.VolumeId,
							Name: singleVol.Tags[1].Value,
							BackupConfig: {
								BackupTypes: [
									{ Frequency: 1, Expiry: 12 },
									{ Frequency: 168, Expiry: 672, Alias: 'Weekly' },
									{ Frequency: 48, Expiry: 144 }
								]
							}
						});
					});
					return;
				});
		});
	});
});
