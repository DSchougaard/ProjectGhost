'use strict'
const Promise 	= require('bluebird');
const bcrypt 	= require('bcrypt');
const _ 		= require('underscore');

const genSalt 	= Promise.promisify(bcrypt.genSalt);
const hash 		= Promise.promisify(bcrypt.hash);


var schemagic = require('schemagic');

var knex = require(__base + 'database.js')();

// Errors
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError = require(__base + 'errors/ValidationError.js');
const SqlError = require(__base + 'errors/SqlError.js');

const OperationalError 		= Promise.OperationalError;

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


	update(fields){

	}

	del(){

	}
}