import AWS from 'aws-sdk';
AWS.config.update({region: 'ap-southeast-2'});

let deleteSnapshot = (action) => {
	let ec2 = new AWS.EC2();
	return new Promise((resolve) => {
		ec2.deleteSnapshot({
			SnapshotId: action.SnapshotId
		}, (err) => {
			if (err) {
				resolve(err);
			} else {
				resolve({outcome: `Deleted snapshot ${action.SnapshotId}`});
			}
		});
	});
};

export {deleteSnapshot};
