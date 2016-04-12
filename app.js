// Define Base Path
global.__base 		= __dirname + '/';

// Libraries
const restify 			= require('restify');
const fs				= require('fs');
const bunyan 			= require('bunyan');
const bcrypt 			= require('bcrypt');

// Routes
const users 			= require(__base + 'routes/users.js');
const auth 				= require(__base + 'routes/auth.js');
const passwords			= require(__base + 'routes/passwords.js');
const categories  		= require(__base + 'routes/categories.js');
const invites 			= require(__base + 'routes/invite.js');
const audit 			= require(__base + 'routes/audit.js');

// Middlewares
const serveStatic 		= require(__base + 'middlewares/serveStatic.js')


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
}else if( config.database === 'mysql' ){
	opts.connection = config.mysql_connection;
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

server.pre(restify.pre.sanitizePath());

server.use(restify.bodyParser());
server.use(restify.queryParser());

//server.on('uncaughtException', function (req, res, route, err) {
//    console.log('uncaughtException', err.stack);
//});

var knex = require(__base + 'database.js');

/*
	Database Table Create
*/
knex.schema.createTableIfNotExists('users', function(table){
	table.increments('id').primary();
	table.boolean('isAdmin').notNullable().defaultTo(false);
	table.string("username").unique().notNullable();
	table.string("salt").notNullable();
	table.string("password").notNullable();
	table.string("privatekey", 4417).notNullable();
	table.string('iv').notNullable();
	table.string('pk_salt').notNullable();
	table.string("publickey", 1189).notNullable();
	table.string('two_factor_secret').nullable();
	table.boolean('two_factor_enabled').defaultTo(false);
})
.then(function(){
	console.log("Database was empty. Creating default Admin account -- this will take some time.");
	var User = require(__base + 'models/user.js');
	var forge 		= require('node-forge');


	var rootUser = {
		username: 'admin',
		isAdmin: true,
		password: 'admin'
	}

	var keypair = forge.pki.rsa.generateKeyPair({bits: 4098, e: 0x10001});

	var pem = {}
	pem.privatekey = forge.pki.privateKeyToPem(keypair.privateKey);
	pem.publickey  = forge.pki.publicKeyToPem(keypair.publicKey);

	rootUser.publickey = forge.util.encode64(pem.publickey);

	var pk_salt = forge.random.getBytes(32);
	var iv 		= forge.random.getBytes(16);

	var encryptionKey = forge.pkcs5.pbkdf2('password', pk_salt, 10000, 32);
	var cipher = forge.cipher.createCipher('AES-CBC', encryptionKey);
	cipher.start({iv: iv});
	cipher.update(forge.util.createBuffer( pem.privatekey.toString('utf8') ));
	cipher.finish();

	rootUser.iv = forge.util.encode64(iv),
	rootUser.pk_salt = forge.util.encode64(pk_salt), 
	rootUser.privatekey =  forge.util.encode64(cipher.output.getBytes());

	User.create(rootUser)
	.then(function(id){
		console.log("Admin user generated");
	});
})
.catch(function(error){
});

knex.schema.createTableIfNotExists('categories', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users').notNullable();
	table.integer('parent').unsigned().references('id').inTable('categories').nullable();
	table.string('title').notNullable();
})
.catch(function(error){
});

knex.schema.createTableIfNotExists('passwords', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users');
	table.integer('parent').unsigned().references('id').inTable('categories');
	table.string('title').notNullable();
	table.string('password').notNullable();
	table.string('username').nullable();
	table.string('url').nullable();
	table.string('note').nullable();
})
.catch(function(error){
});

knex.schema.createTableIfNotExists('invites', function(table){
	table.increments('id').primary();
	table.uuid('link').unique().notNullable();
	table.dateTime('expires').notNullable();
	table.boolean('used').defaultTo(false);
}).catch(function(error){
});

knex.schema.createTableIfNotExists('shared_passwords', function(table){
	table.increments('id').primary();
	table.integer('owner').unsigned().references('id').inTable('users').notNullable();
	table.integer('origin_owner').unsigned().references('id').inTable('users').notNullable();
	table.integer('parent').unsigned().references('id').inTable('categories').nullable();
	table.integer('origin_password').unsigned().references('id').inTable('passwords').notNullable();
	table.string('password').notNullable();
}).catch(function(error){
});

knex.schema.createTableIfNotExists('audit', function(table){
	table.increments('id').primary();
	table.integer('userId').unsigned().references('id').inTable('users').notNullable();
	table.string('targetType').unsigned().notNullable();
	table.integer('targetId').unsigned();
	table.integer('action').unsigned().notNullable();
	table.dateTime('time').notNullable();
	table.string('host').notNullable();
}).catch(function(error){
});

// Routes
server.get('/api/ping', function(req, res, next){
	res.send(200, 'OK');
	return next();
});

// Routes
users(server, log);
auth(server, knex, log);
passwords(server, knex, log);
categories(server, log);
invites(server, log);
audit(server);

// Since Javascript won't allow me to do negative lookahead in regex, all remaining (non-matched) calls to the
// /api will get an error equivalent to Restify's own internal message.
server.get('/api/.*', error);
server.head('/api/.*', error);
server.post('/api/.*', error);
server.put('/api/.*', error);
server.del('/api/.*', error);
server.patch('/api/.*', error);
function error(req, res, next){
	return next( new restify.errors.ResourceNotFoundError(req.url) );
}


// Finally catch all routes for static content.
server.get(/.*/, serveStatic({
  	directory: __base + 'public',
    default: 'index.html'
}));

if( process.env.NODE_ENV === 'test' ){
	module.exports = server;
}else{
	server.listen(opts.port);
}

console.log(new Date());
