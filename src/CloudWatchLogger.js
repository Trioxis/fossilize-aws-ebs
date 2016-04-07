import AWS from 'aws-sdk';
import util from 'util';

let groupName = 'fossilize';
let streamPrefix = groupName + '-aws-ebs';

let consoleLogOverride = false;
let logs = [];

// Turns on capturing of everything that is printed to console using `console.log`
// Everything is stored in the `logs` array.
let collectConsoleLog = () => {
	if (!consoleLogOverride) {
		(function () {
			consoleLogOverride = true;
			var oldLog = console.log;
			console.log = function() {
				if (arguments['0']) {
					logs.push({
						message: util.format(arguments['0']),
						timestamp: Date.now()
					});
				}
				oldLog.apply(console, arguments);
			};
		})();
	}
};

// Checks that the given log group and log stream exist
// Returns a promise
// Rejects if the log group does not exist
// If the log stream exists, resolves the AWS Log Stream object which includes
//   the `uploadSequenceToken` needed for putLogEvents
// If the log stream does not exist, it is created and an object with the
//   `logStreamName` property set is resolved
// `group` and `stream` are names as strings
let checkAndCreateLogStream = (group, stream) => {
	var cloudwatchlogs = new AWS.CloudWatchLogs();

	return new Promise((resolve, reject) => {
		cloudwatchlogs.describeLogStreams({
			logGroupName: group,
			logStreamNamePrefix: stream
		}, (err, data) => {
			if (err) {
				if (err.message.includes('group does not exist')) {
					err.message = `The log group '${group}' does not exist in CloudWatch. Please create the log group named '${group}' in AWS manually. (AWS error: ${err.message})`;
					reject(err);
				} else {
					reject(err);
				}
			} else {
				let specifiedStream = data.logStreams.filter((logStream) => {
					return logStream.logStreamName === stream;
				});

				if (specifiedStream.length === 1) {
					resolve(specifiedStream[0]);
				} else {
					console.log(`Note: created log stream '${stream}' in log group '${group}' because it did not exist`);
					return resolve(createLogStream(group, stream));
				}
			}
		});
	});
};

// Returns a promise that resolves when the log stream is created successfully
// `group` and `stream` are names as strings
let createLogStream = (group, stream) => {
	var cloudwatchlogs = new AWS.CloudWatchLogs();
	return new Promise((resolve, reject) => {
		cloudwatchlogs.createLogStream({
			logGroupName: group,
			logStreamName: stream
		}, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve({
					logStreamName: stream
				});
			}
		});
	});
};

// Pushes to CloudWatch all console.log lines captured
//    after `collectConsoleLog` was called
// Each line is a CloudWatchLog event
let dumpConsoleLogToCloudWatch = () => {
	return checkAndCreateLogStream(groupName, streamPrefix+'-logs')
		.then((stream) => {
			let pushedLogs = logs;
			logs = [];
			return pushEventsToCloudWatch(pushedLogs, stream.logStreamName, stream.uploadSequenceToken);
		});
};

// Push a single event object to CloudWatchLogs
let logToCloudWatch = (obj) => {
	return checkAndCreateLogStream(groupName, streamPrefix+'-metrics')
		.then((stream) => {
			let events = [{
				message: JSON.stringify(obj),
				timestamp: Date.now()
			}];
			return pushEventsToCloudWatch(events, stream.logStreamName, stream.uploadSequenceToken);
		});
};

// Push events array to CLoudWatchLogs.
// Retries if it had an invalid sequence token
// `stream` is a stream name as string
// `nextToken` is the uploadSequenceToken, is optional and can be wrong
let pushEventsToCloudWatch = (events, stream, nextToken) => {
	var cloudwatchlogs = new AWS.CloudWatchLogs();
	return new Promise((resolve, reject) => {
		cloudwatchlogs.putLogEvents({
			logEvents: events,
			logGroupName: groupName,
			logStreamName: stream,
			sequenceToken: nextToken
		}, (err, data) => {
			if (err) {
				if (err.code === 'InvalidSequenceTokenException') {
					let seq = err.message.match(/\d+/)[0];
					resolve(pushEventsToCloudWatch(events, stream, seq));
				} else {
					reject(err);
				}
			} else {
				resolve(data);
			}
		});
	});
};

export {
	logToCloudWatch,
	collectConsoleLog,
	dumpConsoleLogToCloudWatch,
	checkAndCreateLogStream,
	pushEventsToCloudWatch
};
