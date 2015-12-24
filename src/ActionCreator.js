let makeDeleteAction = (snap) => {
	return {snap};
};

let makeCreateAction = (volume, snapList) => {

	return determineBackupsNeeded(volume, snapList).map(backup => backup);
};

let determineBackupsNeeded = (volume, snapList) => {
	return {volume, snapList};
};

export {makeDeleteAction, makeCreateAction, determineBackupsNeeded};
