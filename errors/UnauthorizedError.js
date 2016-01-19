const Promise 	= require('bluebird');
const util 		= require('util');

function UnauthorizedError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'UnauthorizedError';
}
util.inherits(UnauthorizedError, Promise.OperationalError);

module.exports = UnauthorizedError;