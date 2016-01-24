'use strict'
const Promise 	= require('bluebird');
const _ 		= require('underscore');

const schemagic = require('schemagic');

const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');

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
		this.iv			= input.iv;
		this.note 		= input.note;
	}

	static find(id){
		if( typeof id !== 'number' ){
			return new Promise.reject( new ValidationError('wrong type', 'id') );
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

			var validate = schemagic.password.validate(rows[0])

			if( !validate.valid ){
				return new Promise.reject( new ValidationError(validate.errors[0].message, validate.errors[0].message) );
			}
			
			return new Promise.resolve(new Password(rows[0]));

		});
	}
}




/*

knex.schema.createTableIfNotExists('passwords', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users');
	table.integer('parent').unsigned().references('id').inTable('categories');
	table.string('title').notNullable();
	table.string('password').notNullable();
	table.binary('iv', 16).notNullable();
	table.string('username').nullable();
	table.string('note').nullable();
})

*/