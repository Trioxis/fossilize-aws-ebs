import expect from 'expect.js';

import EC2Store from '../src/EC2Store';

describe('EC2Store', () => {
	describe('listSnapshots', () => {
		it('should ask AWS EC2 for a list of all snapshots');
		it('should return a Promise that resolves to an array of EC2 snapshots');
		it('should filter snapshots so that only snapshots owned by us ... something')
	});

	describe('listEBS', () => {
		it('should ask AWS EC2 for a list of all EBS volumes');
		it('should return a Promise that resolves to an arrat of EBS volumes');
	});
});
