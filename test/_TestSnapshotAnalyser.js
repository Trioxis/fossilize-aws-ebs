import expect from 'expect.js';

import SnapshotAnalyser from '../src/SnapshotAnalyser';

describe('SnapshotAnalyser', () => {
	describe('findDeadSnapshots', () => {
		it('should remove snapshots still within their expiry from the given list');
	});

	describe('snapshotIsDead', () => {
		it('should return true if the snapshot is past its expiry date');
		it('should return false if the snapshot is still within its expiry date');
	})
})
