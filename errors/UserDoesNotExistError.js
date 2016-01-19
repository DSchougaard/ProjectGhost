const Promise 	= require('bluebird');
const util 		= require('util');

function UserDoesNotExistError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'UserDoesNotExistError';
}
util.inherits(UserDoesNotExistError, Promise.OperationalError);

module.exports = UserDoesNotExistError;