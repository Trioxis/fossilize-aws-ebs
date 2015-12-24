import expect from 'expect.js';

import {makeDeleteAction, makeCreateAction} from '../src/ActionCreator';

describe('ActionCreator', () => {
	describe('makeDeleteAction', () => {
		it('should create a deletion action for the given snapshot');
	});

	describe('makeCreateAction', () => {
		it('should return true if the snapshot is past its expiry date');
		it('should return false if the snapshot is still within its expiry date');
	});

	describe('determineBackupsNeeded', () => {
		it('should return a list of backups needed for the given volume based on recentness of the snapshots in the snaphot list');
	});
});
