// Class that gets information from AWS using the AWS Node API.
class EC2Store {
	// TODO: Decide if/where credentials are passed in to the class
	constructor () {

	}

	// A list of all snapshots in the AWS account. Should return a Promise.
	// TODO: * Do you want to filter out the snapshots you don't need here
	//	where the request is made or later in the script? Should this return
	// 	the raw data response or convert it in to a nicer format?
	listSnapshots () {
		return Promise.resolve([]);
	}

	// A list of all EBS volumes in the AWS account. Should return a Promise.
	// TODO: Same questions as listSnapshots()
	listEBS () {
		return new Promise((res) => {res([]);});
	}
}


export default EC2Store;
