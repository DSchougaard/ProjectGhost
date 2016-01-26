'use strict'
/*cnst Promise 	= require('bluebird');
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
/*
const Promise 	= require('bluebird');
const util 		= require('util');

function ValidationError(message, property){ 
	Promise.OperationalError.call(this, message);
	this.name = 'ValidationError';

	this.property = property;
}
util.inherits(ValidationError, Promise.OperationalError);

module.exports = ValidationError;
*/

module.exports = class ValidationError extends Error{
	constructor(errors){
		super();
		this.num = errors.length;
		this.errors = errors;
		
		var errString = this.num;
		this.num === 1 ? errString += ' error:' : errString += ' errors:'
		for( let i = 0 ; i < errors.length ; i++  ){
			errString += ' ' + errors[i].property + ' ' +  errors[i].message + '.';
		}
		
		this.message = errString;
		this.name = this.constructor.name;
		Error.captureStackTrace(this, ValidationError);
	}
}