'use strict'

const Promise = require('bluebird');
const _ 		= require('underscore');
const schemagic = require('schemagic');

// Models
var User 						= require(__base + 'models/user.js');

// Errors
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const ValidationRestError 		= require(__base + 'errors/ValidationRestError.js');
const CategoryDoesNotExistError = require(__base + 'errors/CategoryDoesNotExistError.js');
const ConflictError 			= require(__base + 'errors/ConflictError.js');
const UnauthorizedError 		= require(__base + 'errors/UnauthorizedError.js');




// Database Handler
var knex = require(__base + 'database.js');

module.exports = class Category{
	constructor(data){
		if( data.meta ){
			this.children 	= data.children;
			this.map 	 	= data.map;
		}else{
			this.meta 	= data.meta;
			this.id 	= data.id;
			this.owner 	= data.owner;
			this.parent = data.parent;
			this.title 	= data.title;
		}
	}

	static create(input){
		var data = _.clone(input);

		var validID = schemagic.categoryInput.validate(data);
		
		if( !validID.valid ){
			return new Promise.reject( new ValidationError(validID.errors) );
		}

		return knex('categories')
		.insert(data)
		.then(function(ids){
			data.id = ids[0];
			return new Promise.resolve( new Category(data) );
		}, function(err){
			// SQLite Username Exists error
			if( err.errno === 19 && err.code === 'SQLITE_CONSTRAINT' ){

				// This is a test. Don't know if it works...
				console.info("Ghost: This is a test. Not sure it will work...");
				return User.find(input.owner)
				.then(function(user){
					return new Promise.reject( new CategoryDoesNotExistError(data.parent) );
				});
			}else if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
				return new Promise.reject( new SqlError('Database temporarily unavailable') );
			}

			return new Promise.reject( err );
		});
	}



	static find(id){
		var validID = schemagic.id.validate(id);
		if( !validID.valid ){
			return new Promise.reject( new ValidationError(validID.errors) );
		}

		return knex('categories')
		.where('id', id)
		.then(function(rows){

			if( rows.length === 0 ){
				return new Promise.reject( new CategoryDoesNotExistError(id) );
			}
			if( rows.length > 1 ){
				return new Promise.reject( new OperationalError('Catatrophic database error. Multiple users with same ID found.') );
			}

			return new Promise.resolve( new Category( rows[0]) );
		}, function(err){
			if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
				return new Promise.reject( new SqlError('Database temporarily unavailable') );
			}

			return new Promise.reject( err );
		});

	}

	static findAll(user){
		return knex('categories')
		.where('owner', user.id)
		.then(function(categories){
			return categories;
		}, function(err){
			return new Promise.reject( err );
		})
	}

	update(data){
		var self = this;

		var validate = schemagic.categoryUpdate.validate(data);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		function success(rows){
			if( rows === 0 ){
				// No rows was affected
				return new Promise.reject(new SqlError('Category was not found'));
			}
			if( rows > 1 ){
				// Multiple rows affected.. WHAT?!
				return new Promise.reject(new SqlError('Catastrophic database error. Several categories were deleted'));
			}

						// Applying the update
			_.mapObject(data, function(val, key){
				self[key] = val;
			});
			
			return new Promise.resolve(self);
		}

		function fail(rows){
			if( err.errno === 19 && err.code === 'SQLITE_CONSTRAINT' ){
				console.log(err);
				return new Promise.reject( new SqlError('Invalid owner or parent') );
			}else if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
				return new Promise.reject( new SqlError('Database temporarily unavailable') );
			}
		}

		if( _.has(data, 'parent') && data.parent !== null ){
			return knex('categories')
			.where('id', data.parent)
			.then(function(parent){
				if( parent[0].owner != self.owner ){
					return new Promise.reject( new UnauthorizedError('New parent has different owner') );
				}

				return knex('categories')
				.where('id', self.id)
				.update(data)
				.then(success, fail);
			});
		}

		return knex('categories')
		.where('id', self.id)
		.update(data)
		.then(success, fail);
	}

	del(){
		var self = this;

		if( typeof this.id !== 'number' ){
			return new Promise.reject( new ValidationError([{message: 'is the wrong type', property: 'user.id'}]) );
		}

		return knex('categories')
		.where('id', self.id)
		.del()
		.then(function(rows){
			if( rows === 0 ){
				// No rows was affected
				return new Promise.reject(new SqlError('Category was not found'));
			}
			if( rows > 1 ){
				// Multiple rows affected.. WHAT?!
				return new Promise.reject(new SqlError('Catastrophic database error. Several categories were deleted'));
			}

			return new Promise.resolve(true);
		}, function(err){
			if( err.errno === 19 && err.code === 'SQLITE_CONSTRAINT' ){
				return new Promise.reject( new SqlError('Category had attached children') );
			}

			if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
				return new Promise.reject( new SqlError('database temporarily unavailable') );
			}

			return new Promise.reject( err );
		});
	}
}