const fs = require('fs');
const restify = require('restify');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

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

		if( req.body.username === '' || !validator.isAlphanumeric(req.body.username) ){
			return next(new restify.errors.BadRequestError("Malformed Username"));
		}

		if( req.body.password === '' ){
			return next(new restify.errors.BadRequestError("Password was empty"));
		}



		bcrypt.genSalt(function(err, salt){
			if(err){
				console.log("POST /api/user Error generating salt: %s.", err);
				next(new restify.errors.InternalServerError("Error generating salt."));
			}

			console.log("Salt created = %s", salt);

			bcrypt.hash(req.body.password, salt, function(err, hash){
				console.log("Hashed password = %s", hash);
				knex('users').insert({username: req.body.username, password: hash, salt: salt})
				.then(function(rows){
					console.log("POST /api/user DB insert: %s", rows);
					res.send(200, 'User ' + req.body.username + ' added.');
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
		})
	})

	server.put('/user', function(req, res, next){
		next(new restify.errors.NotImplementedError("Later..."));
	})

	server.del('/user', function(req, res, next){
		next(new restify.error.shtNtotImplementedError("Later..."));
	})
};