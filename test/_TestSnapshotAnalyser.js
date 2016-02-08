import expect from 'expect.js';

import {findDeadSnapshots, snapshotIsDead} from '../src/Analyser';

describe('Analyser', () => {
	describe('findDeadSnapshots', () => {
		it.skip('should remove snapshots that are still within their expiry from the given list');
	});

	describe('snapshotIsDead', () => {
		it.skip('should return true if the snapshot is past its expiry date');
		it.skip('should return false if the snapshot is still within its expiry date');
	});
});
