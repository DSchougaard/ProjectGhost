// Define Base Path
global.__base = __dirname + '/';


// Libraries
const restify 	= require('restify');
const fs		= require('fs');

// Routes
const users 	= require(__base + 'routes/users.js');

// Command Line parameters
var Ghost = require('commander');
Ghost
	.version('0.0.1')
	.option('-db, --database', "Path to DB file.")
	.parse(process.argv);

var dbfile = "";

Ghost.database? dbfile = Ghost.database : dbfile = "./ghost.sqlite";
dbfile = "unittest.sqlite"


console.log("Ghost boots using %s as database file.", dbfile);


var port = 8080;











var server = restify.createServer({
	certificate: fs.readFileSync('crypto/ssl/ghost.crt'),
	key: fs.readFileSync('crypto/ssl/ghost.key'),
	name: "Project Ghost"
});


server.listen(port);
server.use(restify.bodyParser());

// Database through Knex
const knex = require('knex')({
	client: 'sqlite3',
	connection:{
		filename: dbfile,
		debug:true
	}
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
	//console.log("The table 'users' already existed in the database.");
})

// Routes

server.get('/api/ping', function(req, res, next){
	res.send(200, 'OK');
	return next();
});

server.get('/error', function(req, res, next){
	fs.readFile('filedoesnotexist', function(err, data){
		if(err)
			console.log("%j.", err);
		next.ifError(err);

	});
})

// Routes
users(server, knex);


// Finally catch all routes for static content.
server.get('/', restify.serveStatic({
  directory: __dirname+'/public',
  default: '/views/index.html'
}));

server.get(/^\/?.*/, restify.serveStatic({
    directory: __dirname + '/public',
    default: 'index.html'
}));

console.log('Project Ghost started on port %d', port );

module.exports.getServer = server;