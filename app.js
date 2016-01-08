// Define Base Path
global.__base = __dirname + '/';


// Libraries
const restify 	= require('restify');
const fs		= require('fs');

// Routes
const users 	= require(__base + 'routes/users.js');


var server = restify.createServer({
	certificate: fs.readFileSync('crypto/ssl2/ghost.crt'),
	key: fs.readFileSync('crypto/ssl2/ghost.key'),
	name: "Project Ghost"
});

server.listen(8080);
server.use(restify.bodyParser());

// Database through Knex
const knex = require('knex')({
	client: 'sqlite3',
	connection:{
		filename: "./ghost.sqlite",
		debug:true
	}
});

// Create table USERS if it doesn't exist
knex.schema.createTableIfNotExists('users', function(table){
	table.increments();
	table.string("username").unique();
	table.string("salt")
	table.string("password");
	table.timestamps();
})
.catch(function(error){
	console.log("The table 'users' already existed in the database.");
})

knex('users').insert({
	username:"daniel", 
	salt:"", 
	password:"password"})
.then(function(rows){
	console.log("User was inserted into the database.");
})
.catch(function(error){
	console.log("DB Error: %s.", error);
})

// Routes
server.get('/', restify.serveStatic({
  directory: __dirname+'/public',
  default: '/views/index.html'
}));

server.get(/^\/?.*/, restify.serveStatic({
    directory: __dirname + '/public',
    default: 'index.html'
}));

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


users(server, knex);