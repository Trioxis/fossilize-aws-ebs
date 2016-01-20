import expect from 'expect.js';
import sinon from 'sinon';
import winston from 'winston';

import * as metrics from '../../src/metrics';

describe('MetricManager', () => {
	describe('log', () => {
		let sandbox, mocks;

		beforeEach(() => {
			sandbox = sinon.sandbox.create();
			mocks = {};
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('should log with winston', () => {
			mocks.winston = sandbox.stub(winston, 'log');
			let message = 'lol';

			metrics.log(message);

			expect(mocks.winston.called).to.be.ok();
			expect(mocks.winston.args[0]).to.contain(message);
		});
	});
});
