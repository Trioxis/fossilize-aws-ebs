import sinon from 'sinon';
import expect from 'expect.js';

import * as printer from '../src/printing';

describe('Printer', () => {

	let sandbox, mocks;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mocks = {};
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('printSnaplist', () => {
		it('should at least print the SnapshotId and Name of each snapshot', () => {
			mocks.log = sandbox.stub(console, 'log');
			printer.printSnaplist([
				{SnapshotId: '237845', Name: 'franklin'},
				{SnapshotId: '984752987', Name: 'bob'},
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

	describe('printEBSList', () => {
		it('should at least print the VolumeId and Name of each volume', () => {
			mocks.log = sandbox.stub(console, 'log');
			printer.printEBSList([
				{VolumeId: '237845', Name: 'franklin', BackupConfig: { BackupTypes: []}, Snapshots: []},
				{VolumeId: '984752987', Name: 'bob', BackupConfig: { BackupTypes: []}, Snapshots: []},
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

	describe('printStatistics', () => {
		it('prints from a statistics object the properties `snapshots`, `volumes` and `backupTypes`', () => {
			mocks.log = sandbox.stub(console, 'log');
			printer.printStatistics({snapshots: 984752987, volumes: 82634862, backupTypes: 289174});

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
		it('prints out the given array to the warn console line by line', () => {
			mocks.log = sandbox.stub(console, 'warn');
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
			mocks.log = sandbox.stub(console, 'error');
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
