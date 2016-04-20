import sinon from 'sinon';
import expect from 'expect.js';
import moment from 'moment';
import * as logger from '../src/CloudWatchLogger';

import * as printer from '../src/printing';

describe('Printer', () => {

	let sandbox, mocks;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mocks = {};
		mocks.logger = sandbox.stub(logger, 'logToCloudWatch').returns(Promise.resolve());
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('printSnaplist', () => {
		it('should that there are no snapshots if there aren\'t any given', () => {
			mocks.log = sandbox.stub(console, 'log');
			mocks.stdout = sandbox.stub(process.stdout, 'write');
			printer.printSnaplist([]);
			let output = '';
			mocks.log.args.map(call => {
				call.map(line => {
					output += line;
				})
			});
			mocks.stdout.args.map(call => {
				call.map(line => {
					output += line;
				})
			});

			expect(output).to.contain('No snapshots');

			printer.printSnaplist([], true);
			output = '';
			mocks.log.args.map(call => {
				call.map(line => {
					output += line;
				})
			});
			mocks.stdout.args.map(call => {
				call.map(line => {
					output += line;
				})
			});
			expect(output).to.contain('No snapshots');
		});
		it('should print a summary of snapshots', () => {
			mocks.log = sandbox.stub(console, 'log');
			mocks.stdout = sandbox.stub(process.stdout, 'write');
			printer.printSnaplist([
				{SnapshotId: '237845', StartTime: moment(), BackupType: 'Weekly', Name: 'franklin'},
				{SnapshotId: '984752987', StartTime: moment(), BackupType: 'Weekly', Name: 'bob'},
				{SnapshotId: '28764519', StartTime: moment(), BackupType: 'Daily', Name: 'franklin'},
				{SnapshotId: '879387957', StartTime: moment(), Name: 'bob'},
			]);

			let output = '';
			mocks.log.args.map(call => {
				call.map(line => {
					output += line;
				})
			});
			mocks.stdout.args.map(call => {
				call.map(line => {
					output += line;
				})
			});

			expect(output).to.contain('Weekly');
			expect(output).to.contain('Daily');
			expect(output).to.contain('Unknown');
		});
		it('should at least print the SnapshotId and Name of each snapshot in verbose mode', () => {
			mocks.log = sandbox.stub(console, 'log');
			printer.printSnaplist([
				{SnapshotId: '237845', StartTime: moment(), Name: 'franklin'},
				{SnapshotId: '984752987', StartTime: moment(), Name: 'bob'},
			], true);

			let output = '';
			mocks.log.args.map(call => {
				call.map(line => {
					output += line;
				})
			});

			expect(output).to.contain('237845');
			expect(output).to.contain('franklin');
			expect(output).to.contain('984752987');
			expect(output).to.contain('bob');
		});
	});

	describe('printEBSList', () => {
		it('should at least print the VolumeId and Name of each volume', () => {
			mocks.log = sandbox.stub(console, 'log');
			printer.printEBSList([
				{
					VolumeId: '237845',
					Name: 'franklin',
					BackupConfig: {
						BackupTypes: [ {Name: 'Weekly', Frequency: '168', Expiry: '672'}]
					},
					Snapshots: {
						'Weekly': [{SnapshotId: '237845', StartTime: moment(), Name: 'Weekly'}],
					}
				},
				{
					VolumeId: '984752987',
					Name: 'bob',
					BackupConfig: {
						BackupTypes: []
					},
					Snapshots: []
				},
			]);

			let output = '';
			mocks.log.args.map(call => {
				call.map(line => {
					output += line;
				})
			});

			expect(output).to.contain('237845');
			expect(output).to.contain('franklin');
			expect(output).to.contain('984752987');
			expect(output).to.contain('bob');
		});
	});

	describe('printActions', () => {
		it('should print the action type and details about the action', () => {
			mocks.log = sandbox.stub(console, 'log');

			printer.printActions([
				{
					Action: 'SNAPSHOT_VOLUME',
					VolumeId: 'vol-1234abcd',
					VolumeName: 'name-duh',
					BackupType: 'Sometimes',
					ExpiryDate: moment()
				}
			]);

			let output = '';
			mocks.log.args.map(call => {
				call.map(line => {
					output += line;
				})
			});

			expect(output).to.contain('SNAPSHOT_VOLUME');
			expect(output).to.contain('vol-1234abcd');
			expect(output).to.contain('name-duh');
			expect(output).to.contain('Sometimes');
		});
	});

	describe('printStatistics', () => {
		it('prints from a statistics object the properties `snapshots`, `volumes` and `backupTypes`', () => {
			mocks.log = sandbox.stub(console, 'log');
			printer.printStatistics({
				ec2Objects: {
					snapshots: 984752987,
					volumes: 82634862
				},
				backups: {
					backupTypes: 289174,
					expiredSnaps: 12,
					orphanedSnaps: 120
				},
				actions: {
					create: 30,
					delete: 38756
				}
			});

			let output = '';
			mocks.log.args.map(call => {
				call.map(line => {
					output += line;
				})
			});

			expect(output).to.contain('984752987');
			expect(output).to.contain('82634862');
			expect(output).to.contain('289174');
		});
	});

	describe('printWarnings', () => {
		it('prints out the given array to the console line by line', () => {
			mocks.log = sandbox.stub(console, 'log');
			printer.printWarnings(['Help!', 'A message!', 'hello!']);

			let output = '';
			mocks.log.args.map(call => {
				call.map(line => {
					output += line;
				})
			});

			expect(mocks.log.callCount).to.be.above(3);
			expect(output).to.contain('Help!');
			expect(output).to.contain('message!');
			expect(output).to.contain('hello!');
		});
	});

	describe('printError', () => {
		it('prints the error stack to console', () => {
			mocks.log = sandbox.stub(console, 'log');
			printer.printError(new Error('something wrong'));

			let output = '';
			mocks.log.args.map(call => {
				call.map(line => {
					output += line;
				})
			});

			expect(output).to.contain('something wrong');
		});
	});
});
