const Promise 	= require('bluebird');
const util 		= require('util');
/*
function UserDoesNotExistError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'UserDoesNotExistError';
}
util.inherits(UserDoesNotExistError, Promise.OperationalError);

;*/

function UninitializedError(message) {
    this.message = message;
    this.name = "UninitializedError";
    Error.captureStackTrace(this, UninitializedError);
}
UninitializedError.prototype = Object.create(Error.prototype);
UninitializedError.prototype.constructor = UninitializedError;

module.exports = UninitializedError;