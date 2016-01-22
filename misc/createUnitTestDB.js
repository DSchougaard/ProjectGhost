const base64 	= require('../helpers/base64.js');
const fs 		= require('fs');
const bcrypt 	= require('bcrypt');

var knex = require('knex')({
	client: 'sqlite3',
	connection: {
		filename: './unittest.sqlite'
	}
});

const data = require('../misc/unitTestData.js');


var pragma = knex.raw('PRAGMA foreign_keys = ON');

console.log('Creating unittest DB');

// Create table USERS if it doesn't exist
knex.schema.createTableIfNotExists('users', function(table){
	table.increments('id').primary();
	table.boolean('isAdmin').notNullable().defaultTo(false);
	table.string("username").unique().notNullable();
	table.string("salt").notNullable();
	table.string("password").notNullable();
	table.binary("privatekey").notNullable();
	table.binary("publickey").notNullable();
}).then();

knex.schema.createTableIfNotExists('passwords', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users');
	table.integer('parent').unsigned()/*.references('id').inTable('structures')*/;
	table.string('title').notNullable();
	table.string('password').notNullable();
	table.binary('iv', 16).notNullable();
	table.string('username').nullable();
	table.string('note').nullable();
}).then();

knex('users').insert(data.userData)
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
