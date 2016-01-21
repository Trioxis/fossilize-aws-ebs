import winston from 'winston';

// Log a message to all logging handlers
let log = (message) => {
	winston.log('info', message);
};

export {log};
