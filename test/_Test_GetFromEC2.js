import expect from 'expect';

import {getSnapshots} from '../src/GetFromEC2';

describe('getSnapshots', () => {
	it('should return true', () => {
		expect(getSnapshots()).to.be.ok();
	})
});
