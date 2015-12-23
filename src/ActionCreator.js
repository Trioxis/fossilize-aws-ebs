let makeDeleteAction = (snap) => {
	return {snap};
};

let makeCreateAction = (volume, snapList) => {
	return {volume, snapList};
};

export {makeDeleteAction, makeCreateAction};
