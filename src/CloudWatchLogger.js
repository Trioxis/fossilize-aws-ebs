import AWS from 'aws-sdk';

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

export {logToCloudWatch};
