import expect from 'expect.js';
import sinon from 'sinon';
import moment from 'moment';

import {
	checkAndCreateLogStream,
	pushEventsToCloudWatch
} from '../src/CloudWatchLogger';
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
		it('should reject if the log group doesn\'t exist', () => {
			let error = new Error('The specified log group does not exist.');
			error.code = 'ResourceNotFoundException';
			error.message = 'The specified log group does not exist.';
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

	describe('pushEventsToCloudWatch', () => {
		it('should attempt to send the given events array to the given stream', () => {
			mockCWL.putLogEvents = sandbox.stub().yields(null, { nextSequenceToken: '49559447643390120336188858375423323056268601740478120946' });
			return pushEventsToCloudWatch([{
				message: JSON.stringify({an: 'object'}),
				timestamp: 1460005569743
			}], 'fossilize-aws-ebs-logs')
				.then((res) => {
					expect(mockCWL.putLogEvents.args[0][0]).to.eql({
						logEvents: [{
							message: "{\"an\":\"object\"}",
							timestamp: 1460005569743
						}],
						logGroupName: 'fossilize',
						logStreamName: 'fossilize-aws-ebs-logs',
						sequenceToken: undefined
					})
				});
		})
	})
});
