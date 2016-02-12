import AWS from 'aws-sdk';
AWS.config.update({region: 'ap-southeast-2'});

let deleteSnapshot = (action) => {
	let ec2 = new AWS.EC2();
	return new Promise((resolve) => {
		ec2.deleteSnapshot({
			DryRun: true,
			SnapshotId: action.SnapshotId
		}, (err, response) => {
			if (err) {
				resolve(err);
			} else {
				if (response) { console.log(response);}
				resolve({outcome: `Deleted snapshot ${action.SnapshotId}`});
			}
		});
	});
};

export {deleteSnapshot};
