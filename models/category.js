'use strict'

const Promise = require('bluebird');
const _ 		= require('underscore');
const schemagic = require('schemagic');

// Errors
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const ValidationRestError 		= require(__base + 'errors/ValidationRestError.js');
const CategoryDoesNotExistError = require(__base + 'errors/CategoryDoesNotExistError.js');
const ConflictError 			= require(__base + 'errors/ConflictError.js');

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

	addChild(child){
		if(this.children === undefined){
			this.children = [];
		}
		this.children.push(child);
	}


	static create(input){
		var data = _.clone(input);

		var validID = schemagic.categoryInput.validate(data);
		
		if( !validID.valid ){
			console.log("%j", validID);
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
	

				var util = require('util');
				console.log( util.inspect(err, {showHidden: true, depth: null}) );
				//return new Promise.reject( new SqlError('Category already exists') );
				return new Promise.reject( new ConflictError('Category', 'already exists') );
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
		var self = this;

		return knex('categories')
		.where('owner', user.id)
		.then(function(categories){
			return categories;
		}, function(err){
			return new Promise.reject( err );
		})
	}

	static createStructure(categories){
		var self = this;

		var structure = [];

		var map = new Map();

		for( var i = 0 ; i < categories.length ; i++ ){
			categories[i] = new Category(categories[i]);
			map.set(categories[i].id, categories[i]);
		}

		for( var i = 0 ; i < categories.length ; i++ ){
			// Create children list on the category
			var category = categories[i];

			// Create array in parent
			var parent = map.get(category.parent);
			if( parent !== undefined ){
				// Category has a parent
				parent.addChild(category);
			}else{
				// Category does not have a parent.
				structure.push(category);
			}
		}

		var rootCategory = new Category({
			meta: true,
			children: structure,
			map: map
		})


		return rootCategory;
	};	

	static populateStructure(rootCategory){
	}

}