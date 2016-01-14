class MetricManager {
	constructor() {

	}

	// Add a logging handler or metric handler to the manager
	// When someone uses log or pushMetric, this handler will be one of the
	// handlers used.
	use (handler) {

	}

	// Log a message to all logging handlers
	log (message) {

	}

	// Push a metric to all metric handlers
	pushMetric (metric) {

	}

}

export default MetricManager;
