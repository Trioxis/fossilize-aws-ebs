class EC2Store {
	constructor () {

	}

	listSnapshots () {
		return Promise.resolve([]);
	}

	listEBS () {
		return new Promise((res) => {res([]);});
	}
}


export default EC2Store;
