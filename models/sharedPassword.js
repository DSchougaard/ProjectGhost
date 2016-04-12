'use strict'

const Promise = require('bluebird');
const _ 		= require('underscore');
const schemagic = require('schemagic');

// Models
var User 						= require(__base + 'models/user.js');
var Password 					= require(__base + 'models/password.js');

// Errors
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const ValidationRestError 		= require(__base + 'errors/ValidationRestError.js');
const CategoryDoesNotExistError = require(__base + 'errors/CategoryDoesNotExistError.js');
const ConflictError 			= require(__base + 'errors/ConflictError.js');
const UnauthorizedError 		= require(__base + 'errors/UnauthorizedError.js');
const AlreadyExistError	 		= require(__base + 'errors/Internal/AlreadyExistError.js');

// Database Inject
var knexGlobal 					= require(__base + 'database.js');



function SQLErrorHandler(err){
	// SQLite Username Exists error
	if( err.errno === 19 && err.code === 'SQLITE_CONSTRAINT' ){
		console.log(err);
		return new Promise.reject( new SqlError('Password already exists') );
		//throw new SqlError('Username already exists.')
	}else if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
		return new Promise.reject( new SqlError('database temporarily unavailable') );
	}

	return new Promise.reject( err );
}

module.exports = class SharedPassword{
	constructor(input){
		this.id 				= input.id;
		this.owner				= input.owner;
		this.parent 			= input.parent;
		//this.title 				= input.title;
		//this.username 			= input.username;
		this.password 			= input.password;
		//this.url 				= input.url;
		//this.note 				= input.note;

		this.origin_owner 		= input.origin_owner;
		this.origin_password 	= input.origin_password;
	}

	static findSharedFromMe(user, knex){
		// Optinal DB connection overload for transactions
		var knex = ( knex === undefined ? knexGlobal : knex );

		var validate = schemagic.user.validate(user);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		
		return knex
		.select()
		.from('shared_passwords')
		.where('origin_owner', user.id)
		.then(function(rows){
			return rows;
		}, SQLErrorHandler);
	}

	static findAllSharedToMe(user, knex){
		// Optinal DB connection overload for transactions
		var knex = ( knex === undefined ? knexGlobal : knex );

		var validate = schemagic.user.validate(user);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		return knex
		.from('shared_passwords')
		.join('passwords', 'shared_passwords.origin_password','=', 'passwords.id')
		.select('shared_passwords.id', 
			'shared_passwords.owner', 
			'shared_passwords.origin_owner', 
			'shared_passwords.parent', 
			'shared_passwords.password', 
			'shared_passwords.origin_password',
			'passwords.title',
			'passwords.username',
			'passwords.url',
			'passwords.note')
		.where('shared_passwords.owner', user.id)
		.then(function(passwords){
			return passwords;
		},SQLErrorHandler)


		/*
		return knex
		.select()
		.from('shared_passwords')
		.where('owner', user.id)
		.then(function(rows){
			console.log("%j", rows)
			return rows;
		}, SQLErrorHandler);*/
	}

	static find(id, knex){
		// Optinal DB connection overload for transactions
		var knex = ( knex === undefined ? knexGlobal : knex );

		var validID = schemagic.id.validate(id);
		if( !validID.valid ){
			// Dirty dirty hack, to make schemagic accept strings being in int form.
			if( validID.errors.length === 1 ){
				validID.errors[0].property = 'data.id';

				if( validID.errors[0].message === 'pattern mismatch'){
					validID.errors[0].message = 'is the wrong type';
				}
			}
			
			return new Promise.reject( new ValidationError(validID.errors) );
		}

		return knex
		.select()
		.from('shared_passwords')
		.where('id', id)
		.then(function(password){
			if( password.length === 0 ){
				return new Promise.reject( new PasswordDoesNotExistError(id) );
			}

			if( password.length > 1 ){
				return new Promise.reject( new SqlError('Multiple passwords found for same ID. Catastrophic error.') );
			}

			return Promise.resolve( new SharedPassword(password[0]) );
		}, SQLErrorHandler);
	}

	static _create(input, knex){
		// Optinal DB connection overload for transactions
		var knex = ( knex === undefined ? knexGlobal : knex );

		var validate = schemagic.sharedPasswordInput.validate(input);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		var data = {};
		_.extend(data, input);
		/*
			Can contain:
			Parent
			Password
		*/

		return knex('shared_passwords')
		.insert(data)
		.then(function(ids){
			data.id = ids[0];
        	return new Promise.resolve( new SharedPassword(input) );
		}, function(err){
			if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
				return new Promise.reject( new SqlError('database temporarily unavailable') );
			}else if( err.errno !== 19 && err.code !== 'SQLITE_CONSTRAINT'  ){
				return new Promise.reject( err );
			}

			return Promise.all([ User.find(data.origin_owner), User.find(data.owner), Password.find(data.origin_password) ]);
		});
	}

	static create(input, knex){
		// Optinal DB connection overload for transactions
		var knex = ( knex === undefined ? knexGlobal : knex );

		var validate = schemagic.sharedPasswordInput.validate(input);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		var data = {};
		_.extend(data, input);
		/*
			Can contain:
			Parent
			Password
		*/

		return knex.transaction(function(trx){

			return trx
			.select()
			.from('shared_passwords')
			.where({
				owner: input.owner,
				origin_owner: input.origin_owner,
				origin_password: input.origin_password
			})
			.then(function(rows){
				if( rows.length !== 0 ){
					return new Promise.reject( new AlreadyExistError('Shared password') );
				}

				return trx
				.insert(input)
				.into('shared_passwords')
				.then(function(ids){
					data.id = ids[0];
	        		return new Promise.resolve( new SharedPassword(input) );
				});

			});
		})
		.catch(function(err){
			if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
				return new Promise.reject( new SqlError('database temporarily unavailable') );
			}else if( err.errno !== 19 && err.code !== 'SQLITE_CONSTRAINT'  ){
				return new Promise.reject( err );
			}

			return Promise.all([ User.find(data.origin_owner), User.find(data.owner), Password.find(data.origin_password) ]);
		});


	}

	static sourceDel(password, knex){
		// Optinal DB connection overload for transactions
		var knex = ( knex === undefined ? knexGlobal : knex );

		var self = this;
		var validate = schemagic.password.validate(password);

		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}
		
		return knex
		.from('shared_passwords')
		.where('origin_password', password.id)
		.andWhere('origin_owner', password.owner)
		.del()
		.then(function(rows){
			return new Promise.resolve(rows);
		}, SQLErrorHandler)
	}

	del(knex){
		// Optinal DB connection overload for transactions
		var knex = ( knex === undefined ? knexGlobal : knex );

		var self = this;
		//console.log("%j", self)
		var validate = schemagic.sharedPassword.validate(self);

		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		return knex
		.del()
		.from('shared_passwords')
		.where('id', self.id)
		.then(function(rows){
			if( rows === 0 ){
				return new Promise.reject(new PasswordDoesNotExistError(self.id));
			}
			
			if( rows > 1 ){
				return new Promise.reject(new SqlError('Catastrophic database error. Several passwords were deleted.'));
			} 

			return new Promise.resolve(true);
		}, SQLErrorHandler);
	}

	update(input, knex){
		// Optinal DB connection overload for transactions
		var knex = ( knex === undefined ? knexGlobal : knex );

		var self = this;
		var validate = schemagic.sharedPassword.validate(self);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}
		
		validate = schemagic.sharedPasswordUpdate.validate(input);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		return knex
		.update(input)
		.from('shared_passwords')
		.where('id', self.id)
		.then(function(num){

			if( num.length === 0 ){
				return new Promise.reject( new SqlError('Password ID was not found') );
			}

			if( num.length > 1 ){
				return new Promise.reject( new SqlError('Multiple users found. Something was wrong.') );	
			}

			// Applying the update
			_.mapObject(input, function(val, key){
				self[key] = val;
			});
			
			return new Promise.resolve(self);
		
		}, SQLErrorHandler);
	}

}