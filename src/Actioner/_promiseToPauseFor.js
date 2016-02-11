let _promiseToPauseFor = (ms) => new Promise(resolve => {
	setTimeout(resolve, ms);
});

export default _promiseToPauseFor;
