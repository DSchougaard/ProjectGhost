'use strict'
const Promise 	= require('bluebird');
const bcrypt 	= require('bcrypt');
const _ 		= require('underscore');

const genSalt 	= Promise.promisify(bcrypt.genSalt);
const hash 		= Promise.promisify(bcrypt.hash);


var schemagic = require('schemagic');

var knex = require(__base + 'database.js');

// Errors
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError 		= require(__base + 'errors/ValidationError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');
const OperationalError 		= Promise.OperationalError;

function SQLErrorHandler(err){
	// SQLite Username Exists error
	if( err.errno === 19 && err.code === 'SQLITE_CONSTRAINT' ){
		console.log(err);
		return new Promise.reject( new SqlError('Username already exists') );
		//throw new SqlError('Username already exists.')
	}else if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
		return new Promise.reject( new SqlError('database temporarily unavailable') );
	}

	return new Promise.reject( err );
}



module.exports = class User{
	constructor(data){
		this.id 		= data.id;
		this.username 	= data.username;
		this.isAdmin 	= data.isAdmin;
		this.password 	= data.password;
		this.salt 		= data.salt;
		this.privatekey = data.privatekey;
		this.publickey 	= data.publickey;

	}

	static create(input){
		var data = _.clone(input);
		var validate = schemagic.userInput.validate(data);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors[0].message, validate.errors[0].property) );
		}
	
		return genSalt()
		.then(hash.bind(null, data.password))
		.then(function(hash){
			data.password = hash;
			data.salt = hash.substring(0, 29);
			return new Promise.resolve(data);
		})
		.then(knex('users').insert.bind( knex('users') ))
		.then(function(id){

			if( id.length === 0 ){
				return new Promise.reject( new SqlError('User was not inserted') );
			}

			if( id.length > 1 ){
				return new Promise.reject( new SqlError('Catastrophic database error') );	
			}

			data.id = id[0];
			return new Promise.resolve( new User(data) );
		}, function(err){
			// SQLite Username Exists error
			if( err.errno === 19 && err.code === 'SQLITE_CONSTRAINT' ){
				return new Promise.reject( new SqlError('Username already exists') );
				//throw new SqlError('Username already exists.')
			}else if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
				return new Promise.reject( new SqlError('database temporarily unavailable') );
			}

			return new Promise.reject( err );
		});
	}

	static find(id){

		if( typeof id !== 'number' ){
			return new Promise.reject( new ValidationError('wrong type', 'id') )
		}

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

				if( typeof rows[0].isAdmin === 'number' ){
					rows[0].isAdmin = true;
				}
				var validate = schemagic.user.validate(rows[0]);
				if( !validate.valid ){
					return new Promise.reject( new ValidationError(validate.errors[0].message, validate.errors[0].property) );
				}

				return new Promise.resolve(new User(rows[0]));
			});
	}

	update(input){
		var validate = schemagic.userUpdate.validate(input);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors[0].message, validate.errors[0].property) );
		}

		var updated = {}

		if( input.username !== undefined && input.username !== this.username ){
			updated.username = input.username;
		}
		if( input.isAdmin !== undefined && input.isAdmin !== this.isAdmin ){
			updated.isAdmin = input.isAdmin;
		}
		if( input.password !== undefined && input.password !== this.password ){
			updated.password = input.password;
		}
		if( input.privatekey !== undefined && input.privatekey !== this.privatekey ){
			updated.privatekey = input.privatekey;
		}
		if( input.publickey !== undefined && input.publickey !== this.publickey ){
			updated.publickey = input.publickey;
		}


		if( _.has(updated, 'password') ){
			return genSalt()
			.then(hash.bind(null, updated.password))
			.then(function(hash){
				updated.password 	= hash;
				updated.salt 		= hash.substring(0, 29);
				return new Promise.resolve(updated);
			//}).then(knex('users').where('id', 3).update.bind( knex('users') ))
			}).bind(this)
			.then(function(u){
				// Ugly, ugly syntax. But bicthes about unique username otherwise
				return knex('users')
					.update(u)
					.where('id', this.id);
			})
			.then(function(num){
				if( num.length === 0 ){
					return new Promise.reject( new SqlError('User ID was not found') );
				}

				if( num.length > 1 ){
					return new Promise.reject( new SqlError('Multiple users found. Something was wrong.') );	
				}
				
				/*this.username 	= ( typeof updated.username 	!== undefined ? updated.username 	: this.username );
				this.password 	= ( typeof updated.password 	!== undefined ? updated.password 	: this.password );
				this.salt 		= ( typeof updated.salt 		!== undefined ? updated.salt 		: this.salt );
				this.isAdmin 	= ( typeof updated.isAdmin 		!== undefined ? updated.isAdmin 	: this.isAdmin );
				this.privatekey = ( typeof updated.privatekey 	!== undefined ? updated.privatekey 	: this.privatekey );
				this.publickey 	= ( typeof updated.publickey 	!== undefined ? updated.publickey 	: this.publickey );*/

				this.username 	= updated.username 		|| this.username;
				this.password 	= updated.password 		|| this.password;
				this.salt 		= updated.salt 			|| this.salt;
				this.isAdmin 	= updated.isAdmin 		|| this.isAdmin;
				this.privatekey = updated.privatekey 	|| this.privatekey;
				this.publickey 	= updated.publickey 	|| this.publickey;

				return new Promise.resolve( this );

			}, SQLErrorHandler);
		}


		return knex('users').where('id', this.id).update(updated)
			.bind(this)
			.then(function(num){
				if( num.length === 0 ){
					return new Promise.reject( new SqlError('User ID was not found') );
				}

				if( num.length > 1 ){
					return new Promise.reject( new SqlError('Multiple users found. Something was wrong.') );	
				}

				this.username 	= updated.username 		|| this.username;
				this.password 	= updated.password 		|| this.password;
				this.salt 		= updated.salt 			|| this.salt;
				this.isAdmin 	= updated.isAdmin 		|| this.isAdmin;
				this.privatekey = updated.privatekey 	|| this.privatekey;
				this.publickey 	= updated.publickey 	|| this.publickey;

				return new Promise.resolve( this );

			}, SQLErrorHandler);
	}

	del(){
		if( typeof this.id !== 'number' ){
			return new Promise.reject( new ValidationError('is wrong type', 'user.id'));
		}

		return knex('users')
		.where('id', this.id)
		.del()
		.then(function(rows){
			if( rows === 0 ){
				return new Promise.reject(new SqlError('User was not found'));
			}
			if( rows > 1 ){
				return new Promise.reject(new SqlError('Catastrophic database error. Several users where deleted'));
			} 

			return new Promise.resolve(true);
		}, SQLErrorHandler);
	}
}