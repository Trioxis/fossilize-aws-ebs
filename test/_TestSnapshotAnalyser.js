import expect from 'expect.js';

import {findDeadSnapshots, snapshotIsDead} from '../src/SnapshotAnalyser';

describe('SnapshotAnalyser', () => {
	describe('findDeadSnapshots', () => {
		it('should remove snapshots that are still within their expiry from the given list');
	});

	describe('snapshotIsDead', () => {
		it('should return true if the snapshot is past its expiry date');
		it('should return false if the snapshot is still within its expiry date');
	});
});
