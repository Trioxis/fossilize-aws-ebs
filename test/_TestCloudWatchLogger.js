import expect from 'expect.js';
import sinon from 'sinon';
import moment from 'moment';

import {checkAndCreateLogStream} from '../src/CloudWatchLogger';
import AWS from 'aws-sdk';

import ec2Responses from './fixtures/EC2Responses';

describe('CloudWatchLogger', () => {
	let sandbox, mockCWL, mockAWS;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockCWL = {};
		mockAWS = sandbox.stub(AWS, 'CloudWatchLogs').returns(mockCWL);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('checkAndCreateLogStream', () => {
		it('reject if the log group doesn\'t exist', () => {
			let error = new Error('The specified log group does not exist.');
			error.code = 'ResourceNotFoundException';
			error.message = 'The specified log stream does not exist.';
			error.time = "Wed Apr 06 2016 11:50:32 GMT+1000 (AEST)";
			error.requestId = 'f2bb0925-fb99-11e5-a792-ef54832606b1';
			error.statusCode = 400;
			error.retryable = false;
			error.retryDelay = 2.906153886578977;

			mockCWL.describeLogStreams = sandbox.stub().yields(error, {});
			mockCWL.createLogStream = sandbox.stub().yields(null, {});

			return checkAndCreateLogStream()
				.then((data) => {
					expect().fail('checkAndCreateLogStream resolved successfully even though the log group does not exist')
				})
				.catch(err => {
					expect(error.code).to.be('ResourceNotFoundException');
				})
		});
	});
});
