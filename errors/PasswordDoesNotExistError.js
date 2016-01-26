'use strict'
const Promise 	= require('bluebird');
const util 		= require('util');
/*
function PasswordDoesNotExistError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'PasswordDoesNotExistError';
}
util.inherits(PasswordDoesNotExistError, Promise.OperationalError);

module.exports = PasswordDoesNotExistError;
*/

module.exports = class PasswordDoesNotExistError extends Error{
	constructor(id){
		super('Password ID ' + id + ' was not found');
		this.id = id;
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor.name);
	}
}