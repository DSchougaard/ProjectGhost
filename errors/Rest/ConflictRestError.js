const restify 	= require('restify');
const util 		= require('util');

function ConflictRestError(message) {
	restify.RestError.call(this, {
		restCode: 'ConflictError',
		statusCode: 400,
		message: message,
		constructorOpt: ConflictRestError
	});
	this.name = 'ConflictError';
	
};

util.inherits(ConflictRestError, restify.RestError);
module.exports = ValidationRestError;