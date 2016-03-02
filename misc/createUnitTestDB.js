const base64 	= require('../helpers/base64.js');
const fs 		= require('fs');
const bcrypt 	= require('bcrypt');

var knex = require('knex')({
	client: 'sqlite3',
	connection: {
		filename: './unittest.sqlite'
	}
});

const sleep = require('sleep');

const data = require('../misc/unitTestData.js');

knex.raw('PRAGMA foreign_keys = ON').then();

sleep.sleep(5);

console.log('Creating unittest DB');

// Create table USERS if it doesn't exist
knex.schema.createTableIfNotExists('users', function(table){
	table.increments('id').primary();
	table.boolean('isAdmin').notNullable().defaultTo(false);
	table.string("username").unique().notNullable();
	table.string("salt").notNullable();
	table.string("password").notNullable();
	table.string("privatekey").notNullable();
	table.string('iv').notNullable();
	table.string('pk_salt').notNullable();
	table.string("publickey").notNullable();
}).then();

knex.schema.createTableIfNotExists('categories', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users').notNullable();
	table.integer('parent').unsigned().references('id').inTable('categories').nullable();
	table.string('title').notNullable();
}).then();

knex.schema.createTableIfNotExists('passwords', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users');
	table.integer('parent').unsigned().references('id').inTable('categories');
	table.string('title').notNullable();
	table.string('password').notNullable();
	table.string('username').nullable();
	table.string('url').nullable();
	table.string('note').nullable();
}).then();


knex('users').insert(data.userData)
.then(function(r){
})
.catch(function(e){
	console.log(e);
});

knex('categories').insert(data.categoryData)
.then(function(r){
})
.catch(function(e){
	console.log(e);
});


knex('passwords').insert(data.passwordData)
.then(function(r){
})
.catch(function(e){
	console.log(e);
});


console.log("Unittest Data Prepared");
knex.destroy();
return 0;
