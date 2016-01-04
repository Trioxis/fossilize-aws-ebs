import AWS from 'aws-sdk';
AWS.config.update({region: 'ap-southeast-2'});

// Class that gets information from AWS using the AWS Node API.
class EC2Store {
	// TODO: Decide if/where credentials are passed in to the class. Usually they're
	//	automatically loaded from the instance IAM roles or ~/.aws/credentials
	//	but we should be able to override them
	constructor () {

	}

	// A list of all snapshots in the AWS account. Should return a Promise.
	// TODO: Do you want to filter out the snapshots you don't need here
	//	where the request is made or later in the script? Should this return
	// 	the raw data response or convert it in to a nicer format?
	//  It is also necessary to filter out public snapshots that aren't owned by
	//  the current user. How do you filter only snapshots that we want?
	listSnapshots () {

		return new Promise((resolve, reject) => {
			let ec2 = new AWS.EC2();
			ec2.describeSnapshots({}, function (err, response) {
				if (err) reject(err);
				else resolve(response.Snapshots);
			});
		});
	}

	// A list of all EBS volumes in the AWS account. Should return a Promise.
	// TODO: Same questions as listSnapshots()
	listEBS () {
		return new Promise((res) => {res([]);});
	}
}


export default EC2Store;
