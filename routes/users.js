const fs = require('fs');
const restify = require('restify');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const argon2 = require('argon2');

module.exports = function(server, knex){
	server.get('/api/users', function(req, res, next){
		console.log("GET /api/users");

		knex.select('username').from('users')
		.then(function(rows){
			res.send(200, rows);
			return next();
		})
		.catch(function(error){
			console.log("GET /api/users DB error");
			res.send(500, "Internal database error");
			return next();
		})
	});

	server.post('/api/user', function(req, res, next){
		console.log("POST /api/user %j", req.body);	
		/*
			Request Content
			Username: String
			Password: String
		*/	

		if( req.body.username === undefined || req.body.username === '' || !validator.isAlphanumeric(req.body.username) ){
			console.log("POST /api/user Missing username");
			return next(new restify.errors.BadRequestError("Incomplete request: Missing username"));
		}

		if( req.body.password === undefined || req.body.password === '' ){
			console.log("POST /api/user Missing password");
			return next(new restify.errors.BadRequestError("Incomplete request: Missing password"));
		}

		// Generating a secure salt
		bcrypt.genSalt(function(err, salt){
			if(err){
				console.log("POST /api/user Error generating salt: %s.", err);
				next(new restify.errors.InternalServerError("Error generating salt."));
			}

			// Hashing the password
			bcrypt.hash(req.body.password, salt, function(err, hash){
				req.body.password = '';

				if(err){
					console.log("POST /api/user Error in producing hash of input.");
					return next(new restify.errors.InternalServerError("Error in crypto libraries."));
				}

				knex('users').insert({username: req.body.username, password: hash, salt: salt})
				.then(function(rows){
					console.log("POST /api/user DB insert: %s", rows);
					res.send(200, 'OK');
					return next();
				})
				.catch(function(error){
					// SQLite 3 Username Exists error
					// DB Error: Error: insert into "users" ("password", "salt", "username") values ('password', '', 'daniel') - SQLITE_CONSTRAINT: UNIQUE constraint failed: users.username.
					if( JSON.stringify(error).match(/SQLITE_CONSTRAINT: UNIQUE constraint failed: users.username/ig) ){
						res.send(400, "Username already exists.");
						return next();
					}
					console.log("POST /api/user Undefined DB error: %s.", error);
					res.send(500, "Unknown database error.");
					return next();
				});
			});
		});
	});

	server.put('/api/user', function(req, res, next){
		next(new restify.errors.NotImplementedError("Later..."));
	});

	server.del('/api/user', function(req, res, next){
		console.log("DEL /api/user")
		/*
			Request Content
			Username: String
		*/	

		if( req.body.username === undefined || req.body.username === '' || !validator.isAlphanumeric(req.body.username) ){
			return next(new restify.errors.BadRequestError("Incomplete request: Missing username"));
		}

		knex('users').where({'username': req.body.username}).del()
		.then(function(rows){
			if( rows === 0 ){
				// No user was found to be deleted
				console.log("DEL /api/user client supplied non-existant username.");
				res.send(400, 'username not found');
				return next();
			}

			console.log("Deleted user with username = %s.", req.body.username);
			res.send(200, 'OK');
			return next();
		})
		.catch(function(err){
			console.log(err);
			next(err);
		});
	});
};