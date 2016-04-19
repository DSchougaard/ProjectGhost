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
const AlreadyExistError 	= require(__base + 'errors/Internal/AlreadyExistError.js');

function SQLErrorHandler(err){
	// SQLite Username Exists error
	if( err.errno === 19 && err.code === 'SQLITE_CONSTRAINT' ){
		//return new Promise.reject( new SqlError('Username already exists') );
		return new Promise.reject( new AlreadyExistError('Username') );
		//throw new SqlError('Username already exists.')
	}else if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
		return new Promise.reject( new SqlError('database temporarily unavailable') );
	}

	return new Promise.reject( err );
}



module.exports = class User{
	constructor(data){
		this.id 				= data.id;
		this.username 			= data.username;
		this.isAdmin 			= data.isAdmin;
		this.publickey 			= data.publickey;

		// User Authentication Fields
		this.password 			= data.password;
		this.salt 				= data.salt;

		// Two Factor Authentication Fields
		if( data.two_factor_enabled === undefined ){
			this.two_factor_enabled = false;
		}else{		
			this.two_factor_enabled = data.two_factor_enabled;
		}
		this.two_factor_secret 	= data.two_factor_secret;
		
		// User Private Key Fields
		this.privatekey 		= data.privatekey;
		this.iv 				= data.iv;
		this.pk_salt 			= data.pk_salt;
	}

	static create(input, trx, force){
		var db = trx === undefined ? knex : trx;

		var data = _.clone(input);
		
		var validate = schemagic.userInput.validate(data);
		if( !validate.valid && !force ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}
		
		
		// Override default isAdmin variable
		data.isAdmin = data.isAdmin !== undefined ? data.isAdmin : false; 
	
		return genSalt()
		.then(hash.bind(null, data.password))
		.then(function(hash){
			data.password = hash;
			data.salt = hash.substring(0, 29);
			return new Promise.resolve(data);
		})
		.then(db('users').insert.bind( db('users') ))
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
				//return new Promise.reject( new SqlError('Username already exists') );
				return new Promise.reject( new AlreadyExistError('Username') );
				//throw new SqlError('Username already exists.')
			}else if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
				return new Promise.reject( new SqlError('database temporarily unavailable') );
			}

			return new Promise.reject( err );
		});
	}

	static findAll(){
		return knex
		.select('id', 'username', 'publickey', 'isAdmin')
		.from('users')
		.then(function(rows){
			return new Promise.resolve(rows);
		}, SQLErrorHandler);
	}

	static find(id){
		//id = parseInt(id);
		var validID = schemagic.id.validate(id);
		
		if( !validID.valid ){
			// Dirty dirty hack, to make schemagic accept strings being in int form.
			if( validID.errors.length === 1 && validID.errors[0].message === 'pattern mismatch'){
				validID.errors[0].property = 'user.id';
				validID.errors[0].message = 'is the wrong type';
			}
			
			return new Promise.reject( new ValidationError(validID.errors) );
		}
		
		/*if( typeof id !== 'number' ){
		//if( isNaN(id) ){
			return new Promise.reject( new ValidationError([{message: 'is the wrong type', property: 'user.id'}]) );
		}*/

		
		return knex
			.select()
			.from('users')
			.where('id', id)
			.then(function(rows){
				if( rows.length === 0 ){
					return new Promise.reject( new UserDoesNotExistError(id) );
				}
				if( rows.length > 1 ){
					return new Promise.reject( new OperationalError('Catatrophic database error. Multiple users with same ID found.') );
				}

				if( typeof rows[0].isAdmin === 'number' ){
					rows[0].isAdmin = (rows[0].isAdmin === 1);
				}

				var validate = schemagic.user.validate(rows[0]);
				if( !validate.valid ){
					return new Promise.reject( new ValidationError(validate.errors) );
				}
				
				rows[0].two_factor_enabled = rows[0].two_factor_enabled === 1 ? true : false;

				return new Promise.resolve(new User(rows[0]));
			}, SQLErrorHandler);
	}

	update(input){
		var validate = schemagic.userUpdate.validate(input);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
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
		if( input.iv !== undefined && input.iv !== this.iv ){
			updated.iv = input.iv;
		}
		if( input.pk_salt !== undefined && input.pk_salt !== this.pk_salt ){
			updated.pk_salt = input.pk_salt;
		}
		if( input.publickey !== undefined && input.publickey !== this.publickey ){
			updated.publickey = input.publickey;
		}
		if( input.two_factor_enabled !== undefined && input.two_factor_enabled !== this.two_factor_enabled ){
			updated.two_factor_enabled = input.two_factor_enabled;
		}
		if( input.two_factor_secret !== undefined && input.two_factor_secret !== this.two_factor_secret ){
			updated.two_factor_secret = input.two_factor_secret;
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

				this.username 			= updated.username 			|| this.username;
				this.password 			= updated.password 			|| this.password;
				this.salt 				= updated.salt 				|| this.salt;
				this.isAdmin 			= updated.isAdmin 			|| this.isAdmin;
				this.privatekey 		= updated.privatekey 		|| this.privatekey;
				this.publickey 			= updated.publickey 		|| this.publickey;
				this.two_factor_enabled 	= updated.two_factor_enabled 	|| this.two_factor_enabled;
				this.two_factor_secret 	= updated.two_factor_secret 	|| this.two_factor_secret;


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
			return new Promise.reject( new ValidationError([{message: 'is the wrong type', property: 'user.id'}]) );
		}

		return knex('users')
		.where('id', this.id)
		.del()
		.then(function(rows){
			if( rows === 0 ){
				return new Promise.reject(new SqlError('User was not found'));
			}
			if( rows > 1 ){
				return new Promise.reject(new SqlError('Catastrophic database error. Several users were deleted'));
			} 

			return new Promise.resolve(true);
		}, SQLErrorHandler);
	}
}