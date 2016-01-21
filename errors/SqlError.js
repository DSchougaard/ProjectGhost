const Promise 	= require('bluebird');
const util 		= require('util');
/*
function UserDoesNotExistError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'UserDoesNotExistError';
}
util.inherits(UserDoesNotExistError, Promise.OperationalError);

;*/

function SqlError(errno, code) {
    this.message = code;
    this.name = "SqlError";
    Error.captureStackTrace(this, SqlError);

    this.errno = errno;
}
SqlError.prototype = Object.create(Error.prototype);
SqlError.prototype.constructor = SqlError;

module.exports = SqlError;