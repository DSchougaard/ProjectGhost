/* global __base */
'use strict'
const Promise 	= require('bluebird');
const _ 		= require('underscore');
const schemagic = require('schemagic');


// Objects
var User 					= require(__base + 'models/user.js');

// Errors
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');
const OperationalError      = Promise.OperationalError;

const unittestData = require(__base + 'misc/unitTestData.js');


var knex = require(__base + 'database.js');


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

module.exports = class Password{
	constructor(input){
		this.id 		= input.id;
		this.owner		= input.owner;
		this.parent 	= input.parent;
		this.title 		= input.title;
		this.username 	= input.username;
		this.password 	= input.password;
		this.url 		= input.url;
		this.note 		= input.note;
	}

	static find(id){
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
		.from('passwords')
		.where('id', id)
		.then(function(rows){
			if( rows.length === 0 ){
				return new Promise.reject( new PasswordDoesNotExistError(id) );
			}
			if( rows.length > 1 ){
				return new Promise.reject( new OperationalError('Catatrophic database error. Multiple users with same ID found.') );
			}

			var validate = schemagic.password.validate(rows[0]);
			if( !validate.valid ){
				return new Promise.reject( new ValidationError(validate.errors[0].message, validate.errors[0].property) );
			}
			
			return new Promise.resolve(new Password(rows[0]));

		}, SQLErrorHandler);
	}
	
	static findAll(user){
		var validate = schemagic.user.validate(user);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}
		
		return knex('passwords')
		.select()
		.where('owner', user.id)
		.then(function(rows){
			return rows;
		}, SQLErrorHandler);
	}
    
    static create(input){
        var validate = schemagic.passwordInput.validate(input);
        if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
        }

        return User.find(input.owner)
        .then(function(user){
        	return knex('passwords').insert(input);
        })
        .then(function(id){
            if( id.length > 1 ){
                return new Promise.reject(new SqlError('More than a single entry was inserted'));
            }
            
            input.id = id[0];
            return new Promise.resolve( new Password(input) );
            
        }, function(err){
        	return new Promise.reject(err);
        }, SQLErrorHandler);
    };
	
	update(input){
		var self = this;
		
		var validate = schemagic.passwordUpdate.validate(input);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}
		
		return knex('passwords').where('id', self.id).update(input)
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
	};
	
	del(){
		var self = this;
		var validate = schemagic.password.validate(self);

		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}
		
		return knex('passwords')
		.where('id', self.id)
		.del()
		.then(function(rows){
			if( rows === 0 ){
				return new Promise.reject(new PasswordDoesNotExistError(self.id));
			}
			
			if( rows > 1 ){
				return new Promise.reject(new SqlError('Catastrophic database error. Several passwords were deleted'));
			} 

			return new Promise.resolve(true);
		}, function(err){
			console.log(JSON.stringify(err));
		});
	};

	sharedWith(){
		var self = this;
		var validate = schemagic.password.validate(self);

		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}
		console.log(self.id);
		return knex('shared_passwords')
		.join('users', 'shared_passwords.owner', '=', 'users.id')
		.where('shared_passwords.origin_password', self.id)
		.select('users.id', 'users.username')
		.then(function(rows){
			return new Promise.resolve(rows);
		});
	};
};




/*

knex.schema.createTableIfNotExists('passwords', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users');
	table.integer('parent').unsigned().references('id').inTable('categories');
	table.string('title').notNullable();
	table.string('username').nullable();
	table.string('password').notNullable();
	table.binary('iv', 16).notNullable();
	table.string('note').nullable();
})

*/