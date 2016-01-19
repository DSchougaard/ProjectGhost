const Promise 	= require('bluebird');
const util 		= require('util');

function PasswordDoesNotExistError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'PasswordDoesNotExistError';
}
util.inherits(PasswordDoesNotExistError, Promise.OperationalError);

module.exports = PasswordDoesNotExistError;