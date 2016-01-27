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

		it('should only return snapshots that have the `backups:config-v0` tag');

		it('should map the response to an array of objects that each represent a snapshot', () => {
			// This means converting the Name and backups:config tags to properties
			// and removing all other unnecessary properties

			// Response contains one snapshot so we can easily check that mapping is correct
			mockEC2.describeSnapshots = sinon.stub().yields(null, ec2Responses.snapshots1);

			return ec2Store.listSnapshots()
				.then(snapList => {
					expect(snapList.length).to.be(2);
					expect(snapList).to.eql([
						{
						  ExpiryDate: 201601271120,
						  Name: "web-xvdf-backup-2015-12-27-00-19",
						  SnapshotId: "snap-6c9f5062",
						  StartTime: "Sun Dec 27 2015 00:19:31 GMT+1100 (AEDT)"
						},
						{
						  ExpiryDate: 201605271121,
						  Name: "web-xvdf-backup-2016-01-02-06-58",
						  SnapshotId: "snap-d9d374d7",
						  StartTime: "Sat Jan 02 2016 06:58:55 GMT+1100 (AEDT)"
						}
					]);
					return;
				});
		});
	});

	describe('listEBS', () => {
		it('should ask AWS EC2 for a list of all EBS volumes', () => {
			mockEC2.describeVolumes = sinon.stub().yields(null, ec2Responses.volumes1);

			return ec2Store.listEBS()
				.then(volumeList => {
					expect(mockEC2.describeVolumes.called).to.be.ok();
					return;
				});
		});

		it('should return a Promise that resolves to an array of EBS volumes', () => {
			mockEC2.describeVolumes = sinon.stub().yields(null, ec2Responses.volumes1);
			let volListPromise = ec2Store.listEBS();

			expect(volListPromise).to.be.a(Promise);
			return volListPromise.then(volList => {
				expect(volList).to.be.an(Array);
				expect(volList.length).to.not.be(0);
				return;
			})
		});

		it('should map the response to an array of objects that each represent an EBS volume', () => {
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
