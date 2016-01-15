let loggingHandlers = [];
let metricHandlers = [];

class MetricManager {
	constructor() {

	}

	// Add a logging handler and/or metric handler to the manager. Should check if
	// the handler has a log and/or pushMetric function exposed and add to the
	// relevant handler arrays.
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
