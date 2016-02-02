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
							ExpiryDate: "20160127112018",
							Name: "web-xvdf-backup-2015-12-27-00-19",
							SnapshotId: "snap-6c9f5062",
							StartTime: "Sun Dec 27 2015 00:19:31 GMT+1100 (AEDT)",
							Tags: {
								Name: "web-xvdf-backup-2015-12-27-00-19",
								"backups:config-v0": "ExpiryDate:20160127112018"
							}
						},
						{
							ExpiryDate: "20160527112111",
							Name: "web-xvdf-backup-2016-01-02-06-58",
							SnapshotId: "snap-d9d374d7",
							StartTime: "Sat Jan 02 2016 06:58:55 GMT+1100 (AEDT)",
							Tags: {
								Name: "web-xvdf-backup-2016-01-02-06-58",
								"backups:config-v0": "OtherMetadata:some_random_junk,ExpiryDate:20160527112111"
							}
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
			let firstVol = ec2Responses.volumes1.Volumes[1];
			let secondVol = ec2Responses.volumes1.Volumes[2];
			let thirdVol = ec2Responses.volumes1.Volumes[3];
			mockEC2.describeVolumes = sinon.stub().yields(null, ec2Responses.volumes1);

			return ec2Store.listEBS()
				.then(volList => {
					expect(volList.length).to.be(3);
					expect(volList).to.be.eql([
						{
							VolumeId: firstVol.VolumeId,
							Name: firstVol.Tags[1].Value,
							BackupConfig: {
								BackupTypes: [
									{ Frequency: 1, Expiry: 12 },
									{ Frequency: 168, Expiry: 672, Alias: 'Weekly' },
									{ Frequency: 48, Expiry: 144 }
								]
							},
							Tags: {
								Name: firstVol.Tags[1].Value,
								"backups:config-v0": "[1|12],Weekly,[48|144]"
							}
						},
						{
							VolumeId: secondVol.VolumeId,
							Name: secondVol.Tags[0].Value,
							BackupConfig: {
								BackupTypes: [
									{ Frequency: 24, Expiry: 168, Alias: 'Daily' },
									{ Frequency: 168, Expiry: 672, Alias: 'Weekly' },
									{ Frequency: 48, Expiry: 144 }
								]
							},
							Tags: {
								Name: secondVol.Tags[0].Value,
								"backups:config-v0": "Daily,Weekly,[48|144]"
							}
						},
						{
							VolumeId: thirdVol.VolumeId,
							Name: thirdVol.Tags[1].Value,
							BackupConfig: {
								BackupTypes: [
									{ Frequency: 24, Expiry: 168, Alias: 'Daily' },
									{ Frequency: 168, Expiry: 672, Alias: 'Weekly' },
									{ Frequency: 1, Expiry: 24, Alias: 'Hourly' }
								]
							},
							Tags: {
								Name: thirdVol.Tags[1].Value,
								"backups:config-v0": "Daily,Weekly,Hourly"
							}
						}
					])
					return;
				});
		});

		it('should gracefully handle errors in tags', () => {
			// This means converting the Name and backups:config tags to properties
			// and removing all other unnecessary properties

			// Response contains one snapshot so we can easily check that mapping is correct
			let firstVol = ec2Responses.volumes2.Volumes[1];
			let secondVol = ec2Responses.volumes2.Volumes[2];
			let thirdVol = ec2Responses.volumes2.Volumes[3];
			mockEC2.describeVolumes = sinon.stub().yields(null, ec2Responses.volumes2);

			return ec2Store.listEBS()
				.then(volList => {
					expect(volList.length).to.be(2);
					expect(volList).to.be.eql([
						{
							VolumeId: secondVol.VolumeId,
							Name: secondVol.Tags[0].Value,
							BackupConfig: {
								BackupTypes: [
									{ Frequency: 24, Expiry: 168, Alias: 'Daily' },
								]
							},
							Tags: {
								Name: secondVol.Tags[0].Value,
								"backups:config-v0": "Daily,Weeeeeeeeekly,[2,144]"
							}
						},
						{
							VolumeId: thirdVol.VolumeId,
							Name: thirdVol.VolumeId,
							BackupConfig: {
								BackupTypes: [
									{ Frequency: 24, Expiry: 168, Alias: 'Daily' },
									{ Frequency: 1, Expiry: 24, Alias: 'Hourly' }
								]
							},
							Tags: {
								"backups:config-v0": "Daily,Beakly,Hourly"
							}
						}
					])
					return;
				});
			});
	});
});
