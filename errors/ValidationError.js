/*const Promise 	= require('bluebird');
const util 		= require('util');

function ValidationError(message, property) {
    this.message = message;
    this.property = property;
    this.name = "ValidationError";

    Error.captureStackTrace(this, ValidationError);

}
ValidationError.prototype.toString = function(){
	return this.message + ': ' +this.property
} 

module.exports = ValidationError;*/

const Promise 	= require('bluebird');
const util 		= require('util');

function ValidationError(message, property){ 
	Promise.OperationalError.call(this, message);
	this.name = 'ValidationError';

	this.property = property;
}
util.inherits(ValidationError, Promise.OperationalError);

module.exports = ValidationError;