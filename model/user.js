'use strict'
const Promise = require('bluebird');
var schemagic = require('schemagic');

//const userSchema = require(__base + 'schemas/userSchema.js');

var knex = require(__base + 'database.js').get();

// Errors
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError = require(__base + 'errors/ValidationError.js');

const OperationalError 		= Promise.OperationalError;

module.exports = class User{
	constructor(data){
		this.init 	= false;
		this.user 	= {};

		this.user 	= data;
	}

	static create(data){
		var validate = schemagic.userSchema.validate(data);
		if( !validate.valid ){
			console.log("Invalid! %j", validate);
			return new Promise.reject( new ValidationError(validate.errors[0].message, validate.errors[0].property) );
		}

		return new Promise.resolve(new User(data));
	}

	static find(id){
		return knex
			.select()
			.from('users')
			.where('id',id)
			.then(function(rows){
				if( rows.length === 0 ){
					return new Promise.reject( new UserDoesNotExistError(id) );
				}
				if( rows.length > 1 ){
					return new Promise.reject( new OperationalError('Catatrophic database error. Multiple users with same ID found.') );
				}

				var validate = schemagic.userSchema.validate(rows[0]);
				if( !validate.valid ){
					//return new Promise.reject( new ValidationError(validate.message, validate.property) );
					throw new OperationalError("Validation Error!");
					//throw new ValidationError(validate.message, validate.property);
				}

				return new Promise.resolve(new User(rows[0]));
			});
	}
}