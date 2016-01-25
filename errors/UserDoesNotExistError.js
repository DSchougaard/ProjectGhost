'use strict'
const Promise 	= require('bluebird');
const util 		= require('util');

/*
function UserDoesNotExistError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'UserDoesNotExistError';
}
util.inherits(UserDoesNotExistError, Promise.OperationalError);
*/

/*
function UserDoesNotExistError(message) {
    this.message = message;
    this.name = "UserDoesNotExistError";
    Error.captureStackTrace(this, UserDoesNotExistError);
}
UserDoesNotExistError.prototype = Object.create(Error.prototype);
UserDoesNotExistError.prototype.constructor = UserDoesNotExistError;
*/

module.exports = class UserDoesNotExistError extends Error{
	constructor(id){
		super('User ID ' + id + ' was not found');
		this.id = id;
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor.name);
	}
}