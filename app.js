// Define Base Path
global.__base 		= __dirname + '/';


// Libraries
const restify 			= require('restify');
const fs				= require('fs');
const bunyan 			= require('bunyan');

// Routes
const users 			= require(__base + 'routes/users.js');
const auth 				= require(__base + 'routes/auth.js');
const passwords			= require(__base + 'routes/password.js');
const category 			= require(__base + 'routes/category.js');


//Helpers
const authHelpers 		= require(__base + 'helpers/authHelpers.js');

// Load config file
const config 			= require(__base + 'config.json');

// Configure Loggers
var log = bunyan.createLogger({
    name: 'Ghost',
    streams: [{
    	level: 'info',
        path: __base + 'logs/ghost.info.log',
        // `type: 'file'` is implied
    },{
    	level: 'fatal',
    	path: __base + 'logs/ghost.fatal.log',
    },{
    	level: 'error',
    	path: __base +'logs/ghost.error.log'
    },{
    	level: 'debug',
    	path: __base + 'logs/ghost.debug.log'
    }]
});


/*
	Options for Project Ghost
*/
var opts = {
	name 			: typeof config.name 		!== undefined 	? config.name 		: 'Project Ghost',
	database 		: typeof config.database 	!== undefined 	? config.database 	: 'sqlite',
	port 			: typeof config.port 		!== undefined 	? config.port 		: 8080,
	ssl_key			: typeof config.ssl_key 	!== undefined 	? config.ssl_key 	: 'crypto/ssl/ghost.key',
	ssl_cert 		: typeof config.ssl_cert	!== undefined 	? config.ssl_cert 	: 'crypto/ssl/ghost.crt'
};

// Override for DB connection objects
if( config.database === 'sqlite' ){
	opts.connection = config.sqlite_connection;
}

// Unittest DB Override
if( process.env.NODE_ENV === 'test' ){
	opts.connection.filename = './unittest.sqlite';
}
log.info("Bootstrapping Project Ghost with the following options:\n%j", opts);


var server = restify.createServer({
	certificate: fs.readFileSync( opts.ssl_cert ),
	key: fs.readFileSync( opts.ssl_key ),
	name: "Project Ghost",
	log: log
});
server.use(restify.bodyParser());
server.use(restify.queryParser());

// Database through Knex
var knex = require('knex')({
	client: opts.database,
	connection: opts.connection
});
// FOR SOME FUCKING REASON SQLITE DOES NOT HAVE FOREIGN KEYS ENABLED PER DEFAULT
// SO IT HAS TO BE ENABLED MANUALLY.....
knex.raw('PRAGMA foreign_keys = ON').then(function(resp){ });


/*
	Database Table Create
*/
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

knex.schema.createTableIfNotExists('categories', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users').notNullable();
	table.integer('parent').unsigned().references('id').inTable('categories');
	table.string('title');
})
.catch(function(error){
})

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
.catch(function(error){
});


/*
	Passwords Table
	---------------------------
	int: 	ID
	int: 	ownerID
	string: title
	blob: 	username
	string: password
	string: note
*/

/*
	Shared Passwords Table
	---------------------------
	int: 	ID
	int: 	orignalPasswordID
	string: title
	blob: 	username
	string: password
	string: note

*/


// Routes
server.get('/api/ping', function(req, res, next){
	res.send(200, 'OK');
	return next();
});

// Routes
users(server, knex, log);
auth(server, knex, log);
passwords(server, knex, log);
category(server, knex, log);

// Finally catch all routes for static content.
server.get('/', restify.serveStatic({
  directory: __dirname+'/public',
  default: '/views/index.html'
}));
server.get(/^\/?.*/, restify.serveStatic({
    directory: __dirname + '/public',
    default: 'index.html'
}));

if( process.env.NODE_ENV === 'test' ){
	module.exports = server;
}else{
	server.listen(opts.port);
}