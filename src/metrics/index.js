class MetricManager {
	constructor() {
	}

	// Add a logging handler and/or metric handler to the manager. Should check if
	// the handler has a log and/or pushMetric function exposed and add to the
	// relevant handler arrays.
	use (handler) {
		console.void(handler); // I don't think this is actually a function, I'm just making eslint happy for now
	}

	// Log a message to all logging handlers
	log (message) {
		console.void(message);
	}

	// Push a metric to all metric handlers
	pushMetric (metric) {
		console.void(metric);
	}
}

export default MetricManager;
