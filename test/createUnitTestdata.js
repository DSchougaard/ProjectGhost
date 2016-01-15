const base64 = require('../helpers/base64.js');
const fs = require('fs');
const bcrypt = require('bcrypt');

var knex = require('knex')({
	client: 'sqlite3',
	connection: {
		filename: './unittest.sqlite'
	}/*,
	pool: {
		afterCreate: (conn, cb) ->
			conn.run('PRAGMA foreign_keys = ON', cb);
	}*/

})

knex.raw('PRAGMA foreign_keys = ON')
.then(function(resp){
	console.log("Pragma enabled. "+ resp);
})


/*var knex = require('knex')({
	client: 'mysql',
	connection: {
		host 	: '127.0.0.1',
		user 	: 'casper',
		password: 'ghostsecret',
		database: 'ghostdb'
	}
});*/

knex.schema.dropTableIfExists('users');
knex.schema.dropTableIfExists('passwords');

console.log('Creating unittest data');

// Create table USERS if it doesn't exist
knex.schema.createTableIfNotExists('users', function(table){
	table.increments('id').primary();
	table.string("username").unique().notNullable();
	table.string("salt").notNullable();
	table.string("password").notNullable();
	table.binary("privatekey").notNullable();
	table.binary("publickey").notNullable();
})
.catch(function(error){
})

knex.schema.createTableIfNotExists('passwords', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users');
	table.integer('parent').unsigned().references('id').inTable('passwords');
	table.string('title').notNullable();
	table.string('password').notNullable();
	table.binary('iv', 16).notNullable();
	table.string('username').nullable();
	table.string('note').nullable();
})
.catch(function(error){
	console.log(error);
});

var privateKey = fs.readFileSync('test/unittest-test.key');
var publicKey  = fs.readFileSync('test/unittest-test.crt');

var userData = [
	{
		username 	: 'User1',
		password 	: 'password',
		privatekey 	: privateKey.toString('utf8'),
		publickey 	: base64.encode(publicKey.toString('utf8'))
	},
	{
		username 	: 'User2',
		password 	: 'password',
		privatekey 	: privateKey.toString('utf8'),
		publickey 	: base64.encode(publicKey.toString('utf8'))
	}
];


//userData.forEach(function(user){
//var i = 0;
//for( i ; i < userData.length ; i++ ){

for (var i in userData) {
	userData[i].salt = bcrypt.genSaltSync();
	userData[i].password = bcrypt.hashSync(userData[i].password, userData[i].salt);
}

var passwordData = [
	{
		parent 		: null,
		owner 		: 1,
		title 		: 'SomeTitle1',
		username 	: 'SomeUser1',
		password 	: 'password',
		iv 			: '1111111111111111',
		note 		: 'This is clearly a note!' 
	},
	{
		parent 		: null,
		owner 		: 1,
		title 		: 'SomeTitle2',
		username 	: 'SomeUser1',
		password 	: 'password',
		iv 			: '1111111111111111',
		note 		: 'null' 

	},
	{
		parent 		: 1,
		owner 		: 1,
		title 		: 'SomeOtherTitle1.1',
		username 	: 'Doge',
		password 	: 'P@ssw0rd',
		iv 			: '1111111111111111',
		note 		: 'Such password, much secure. Wow.' 

	},
	{
		parent 		: null,
		owner 		: 2,
		title 		: 'SomeTitleAgain',
		username 	: 'BadLuckBrian',
		password 	: 'password',
		iv 			: '1111111111111111',
		note 		: 'Oh no... Not again...' 
	}
]


knex('users').insert(userData)
.then(function(rows){
	console.log('userData succesfully inserted');
})
.catch(function(err){
	console.log('Error inserting userData: ' + err);
});


knex('passwords').insert(passwordData)
.then(function(rows){
	console.log('passwordData succesfully inserted');
})
.catch(function(err){
	console.log('Error inserting passwordData: ' + err);
})

knex.destroy();

return 0;