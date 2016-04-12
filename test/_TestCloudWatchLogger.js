import expect from 'expect.js';
import sinon from 'sinon';
import moment from 'moment';

import {
	log,
	checkAndCreateLogStream,
	pushEventsToCloudWatch,
	dumpConsoleLogToCloudWatch
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

	describe('log', () => {
		it('should log to console.log', () => {
			let consoleLog = sandbox.stub(console, 'log');
			log('Hello there', 'rofl');
			expect(consoleLog.args[0]).to.be.eql(['Hello there', 'rofl'])
		})
	});

	describe('dumpConsoleLogToCloudWatch', () => {
		it('should send its logs to cloudwatch then flush all its cached logs', () => {
			let response = {
				logStreams: [{
					logStreamName: 'fossilize-aws-ebs-logs',
					creationTime: 1459923663107,
					firstEventTimestamp: 1459923660897,
					lastEventTimestamp: 1460005569743,
					lastIngestionTime: 1460005779288,
					uploadSequenceToken: '49559447643390120336188858375423323056268601740478120946',
					arn: 'arn:aws:logs:ap-southeast-2:12345678911:log-group:fossilize:log-stream:fossilize-aws-ebs-logs',
					storedBytes: 7528
				}]
			}

			mockCWL.describeLogStreams = sandbox.stub().yields(null, response);
			mockCWL.putLogEvents = sandbox.stub().yields(null, { nextSequenceToken: '49559447643390120336188858375423323056268601740478120946' });

			return dumpConsoleLogToCloudWatch().then(() => {
				sandbox.useFakeTimers();
				log('Hello there');


				return dumpConsoleLogToCloudWatch()
				.then((res) => {
					expect(mockCWL.putLogEvents.args[1][0]).to.be.eql({
						logEvents: [{
							message: 'Hello there',
							timestamp: 0
						}],
						logGroupName: 'fossilize',
						logStreamName: 'fossilize-aws-ebs-logs',
						sequenceToken: 49559447643390120336188858375423323056268601740478120946
					})

				});
			})


		})
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

			return checkAndCreateLogStream('logGroup', 'logStream')
				.then((data) => {
					expect().fail('checkAndCreateLogStream resolved successfully even though the log group does not exist')
				})
				.catch(err => {
					expect(error.code).to.be('ResourceNotFoundException');
				})
		});

		it('should reject for unknown errors', () => {
			let error = new Error('Unknown Error');
			error.code = 'Exception';
			error.message = 'There was an unknown error';
			error.time = "Wed Apr 06 2016 11:50:32 GMT+1000 (AEST)";
			error.requestId = 'f2bb0925-fb99-11e5-a792-ef54832606b1';
			error.statusCode = 400;
			error.retryable = false;
			error.retryDelay = 2.906153886578977;

			mockCWL.describeLogStreams = sandbox.stub().yields(error, {});
			mockCWL.createLogStream = sandbox.stub().yields(null, {});

			return checkAndCreateLogStream('logGroup', 'logStream')
				.then((data) => {
					expect().fail('checkAndCreateLogStream resolved successfully even though the log group does not exist')
				})
				.catch(err => {
					expect(error.code).to.be('Exception');
				})
		});

		it('should create the specified log stream if it does not exist', () => {
			let response = {
				logStreams: [{
					logStreamName: 'fossilize-aws-ebs-logs',
				  creationTime: 1459923663107,
					firstEventTimestamp: 1459923660897,
					lastEventTimestamp: 1460005569743,
					lastIngestionTime: 1460005779288,
					uploadSequenceToken: '49559447643390120336188858375423323056268601740478120946',
					arn: 'arn:aws:logs:ap-southeast-2:12345678911:log-group:fossilize:log-stream:fossilize-aws-ebs-logs',
					storedBytes: 7528
				}]
			}

			mockCWL.describeLogStreams = sandbox.stub().yields(null, response);
			mockCWL.createLogStream = sandbox.stub().yields(null, {})

			// sandbox.restore();
			return checkAndCreateLogStream('fossilize', 'fossilize-aws-ebs-metrics')
				.then((data) => {
					expect(mockCWL.createLogStream.args[0][0]).to.be.eql({
						logGroupName: 'fossilize',
						logStreamName: 'fossilize-aws-ebs-metrics'
					})
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
		});

		it('should retry with a new upload token if the first one was wrong or not given', () => {
			let error = new Error('');
			error.code = 'InvalidSequenceTokenException'
			error.message = 'The given sequenceToken is invalid. The next expected sequenceToken is: 49559447643390120336188903679850713268628490158155498482';
			error.code = 'InvalidSequenceTokenException';
			error.time = "Tue Apr 12 2016 16:22:16 GMT+1000 (AEST)";
			error.requestId = 'e6e70729-0076-11e6-a20c-a761be2c58f5';
			error.statusCode = 400;
			error.retryable = false;
			error.retryDelay = 57.76881698984653;

			mockCWL.putLogEvents = sandbox.stub()
			mockCWL.putLogEvents.onCall(0).yields(error, null)
			mockCWL.putLogEvents.onCall(1).yields(null, { nextSequenceToken: '49559557653390120336188903956952321373557515805750526900' });

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

					expect(mockCWL.putLogEvents.args[1][0]).to.eql({
						logEvents: [{
							message: "{\"an\":\"object\"}",
							timestamp: 1460005569743
						}],
						logGroupName: 'fossilize',
						logStreamName: 'fossilize-aws-ebs-logs',
						sequenceToken: 49559447643390120336188903679850713268628490158155498482
					})
				});
		});
	})
});
