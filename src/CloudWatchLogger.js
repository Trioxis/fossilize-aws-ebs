import AWS from 'aws-sdk';
import util from 'util';

let groupName = 'fossilize';
let streamPrefix = groupName + '-aws-ebs';

let consoleLogOverride = false;
let logs = [];
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

// returns the nextToken for the logstream
let checkAndCreateLogStream = (group, stream) => {
	var cloudwatchlogs = new AWS.CloudWatchLogs();

	return new Promise((resolve, reject) => {
		cloudwatchlogs.describeLogStreams({
			logGroupName: group,
			logStreamNamePrefix: stream
		}, (err, data) => {
			if (err) {
				if (err.message.includes('group does not exist')) {
					err.message = `The log group '${group}' does not exist in CloudWatch. Please check your logging config is correct or create the log group in AWS yourself. (AWS error: ${err.message})`
					reject(err)
				} else {
					reject(err)
				}
			} else {
				let specifiedStream = data.logStreams.filter((logStream) => {
					return logStream.logStreamName === stream
				})

				if (specifiedStream.length === 1) {
					resolve(specifiedStream[0])
				} else {
					console.log(`Note: created log stream '${stream}' in log group '${group}' because it did not exist`);
					return resolve(createLogStream(group, stream))
				}
			}
		})
	})
}

let createLogStream = (group, stream) => {
	var cloudwatchlogs = new AWS.CloudWatchLogs();
	return new Promise((resolve, reject) => {
		cloudwatchlogs.createLogStream({
			logGroupName: group,
			logStreamName: stream
		}, (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve({
					logStreamName: stream
				});
			}
		});
	});
}

let dumpConsoleLogToCloudWatch = (nextToken) => {
	return checkAndCreateLogStream(groupName, streamPrefix+'-logs')
		.then((stream) => {
			let pushedLogs = logs;
			logs = [];
			var cloudwatchlogs = new AWS.CloudWatchLogs();
			return new Promise((resolve, reject) => {
				cloudwatchlogs.putLogEvents({
					logEvents: pushedLogs,
					logGroupName: groupName,
					logStreamName: stream.logStreamName,
					sequenceToken: nextToken ? nextToken : stream.uploadSequenceToken
				}, (err, data) => {
					if (err) {
						logs = logs.concat(pushedLogs);
						if (err.code === 'InvalidSequenceTokenException') {
							let seq = err.message.match(/\d+/)[0];
							resolve(dumpConsoleLogToCloudWatch(seq));
						} else {
							reject(err);
						}
					} else {
						resolve(data);
					}
				});
			});
	});
};

let logToCloudWatch = (obj) => {
	return checkAndCreateLogStream(groupName, streamPrefix+'-metrics')
		.then((stream) => {
			return tryPut(obj)
	});
};

let tryPut = (obj, nextToken) => {
	var cloudwatchlogs = new AWS.CloudWatchLogs();
	return new Promise((resolve, reject) => {
		cloudwatchlogs.putLogEvents({
			logEvents: [{
				message: JSON.stringify(obj),
				timestamp: Date.now()
			}],
			logGroupName: groupName,
			logStreamName: 'fossilize-aws-ebs-metrics',
			sequenceToken: nextToken
		}, (err, data) => {
			if (err) {
				if (err.code === 'InvalidSequenceTokenException') {
					let seq = err.message.match(/\d+/)[0];
					resolve(tryPut(obj, seq));
				} else {
					reject(err);
				}
			} else {
				resolve(data);
			}
		});
	});
};

export {logToCloudWatch, collectConsoleLog, dumpConsoleLogToCloudWatch};
