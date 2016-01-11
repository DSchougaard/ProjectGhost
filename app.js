// Define Base Path
global.__base 		= __dirname + '/';


// Libraries
const restify 			= require('restify');
const fs				= require('fs');

// Routes
const users 			= require(__base + 'routes/users.js');
const auth 				= require(__base + 'routes/auth.js');

//Helpers
const authHelpers 		= require(__base + 'helpers/authHelpers.js');

// Load config file
const config 			= require(__base + 'config.json');

/*
	Options for Project Ghost
*/
var opts = {
	name 			: typeof config.name 		!== undefined 	? config.name 		: 'Project Ghost',
	database 		: typeof config.database 	!== undefined 	? config.database 	: 'sqlite',
	port 			: typeof config.port 		!== undefined 	? config.port 		: 8080,
	ssl_key			: typeof config.ssl_key 	!== undefined 	? config.ssl_key 	: 'crypto/ssl/ghost.key',
	ssl_cert 		: typeof config.ssl_key 	!== undefined 	? config.ssl_cert 	: 'crypto/ssl/ghost.key'
};

// Override for DB connection objects
if( config.database === 'sqlite' ){
	opts.connection = config.sqlite_connection;
}

// Unittest Override
if( false ){
	opts.connection.file = './unittest.sql';
}

console.log("Bootstrapping Project Ghost with the following options:\n%j", opts);

var server = restify.createServer({
	certificate: fs.readFileSync( opts.ssl_cert ),
	key: fs.readFileSync( opts.ssl_key ),
	name: "Project Ghost"
});
server.listen(opts.port);
server.use(restify.bodyParser());

// Database through Knex
const knex = require('knex')({
	client: opts.database,
	connection: opts.connection
});

// Create table USERS if it doesn't exist
knex.schema.createTableIfNotExists('users', function(table){
	table.increments();
	table.string("username").unique();
	table.string("salt");
	table.string("password");
	table.string("privatekey");
	table.binary("publickey");
})
.catch(function(error){
})

// Routes
server.get('/api/ping', function(req, res, next){
	res.send(200, 'OK');
	return next();
});

// Routes
users(server, knex);
auth(server, knex);

// test for authentication
server.get('/api/auth_test', authHelpers.ensureAuthenticated, function(req, res, next){
	console.log("This should only be printed if authenticated. %s.", req.user);
	res.send(200, 'Congratulations! You are authorized, ' + req.user);
	return next();
});

// Finally catch all routes for static content.
server.get('/', restify.serveStatic({
  directory: __dirname+'/public',
  default: '/views/index.html'
}));
server.get(/^\/?.*/, restify.serveStatic({
    directory: __dirname + '/public',
    default: 'index.html'
}));