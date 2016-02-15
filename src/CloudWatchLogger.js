import AWS from 'aws-sdk';
import util from 'util';

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

let dumpConsoleLogToCloudWatch = (nextToken) => {
	let pushedLogs = logs;
	logs = [];
	var cloudwatchlogs = new AWS.CloudWatchLogs();
	return new Promise((resolve, reject) => {
		cloudwatchlogs.putLogEvents({
			logEvents: pushedLogs,
			logGroupName: 'tmp-1',
			logStreamName: 'tmp-strm-2',
			sequenceToken: nextToken
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
};

let logToCloudWatch = (obj) => {
	return tryPut(obj);
};

let tryPut = (obj, nextToken) => {
	var cloudwatchlogs = new AWS.CloudWatchLogs();
	return new Promise((resolve, reject) => {
		cloudwatchlogs.putLogEvents({
			logEvents: [{
				message: JSON.stringify(obj),
				timestamp: Date.now()
			}],
			logGroupName: 'tmp-1',
			logStreamName: 'tmp-strm-1',
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
