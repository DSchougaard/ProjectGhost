const Promise 	= require('bluebird');
const util 		= require('util');
/*
function UserDoesNotExistError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'UserDoesNotExistError';
}
util.inherits(UserDoesNotExistError, Promise.OperationalError);

;*/

function UserDoesNotExistError(message) {
    this.message = message;
    this.name = "UserDoesNotExistError";
    Error.captureStackTrace(this, UserDoesNotExistError);
}
UserDoesNotExistError.prototype = Object.create(Error.prototype);
UserDoesNotExistError.prototype.constructor = UserDoesNotExistError;

module.exports = UserDoesNotExistError;