'use strict'
const Promise 	= require('bluebird');
const util 		= require('util');

module.exports = class ConflictError extends Error{
	constructor(source, target){
		super(source + ' ' + target);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor.name);
	}
}