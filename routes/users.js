const fs 			= require('fs');
const restify 		= require('restify');
const validator 	= require('validator');
const crypto 		= require('crypto');
const bcrypt 		= require('bcrypt');
const argon2 		= require('argon2');

//const validate 		= require(__base + 'helpers/validate.js');
const base64 = require(__base + 'helpers/base64.js');

module.exports = function(server, knex){
	server.get('/api/users', function(req, res, next){
		console.log("GET /api/users");

		knex.select('username', 'publickey').from('users')
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

	server.get('/api/user/:id', function(req, res, next){
		console.log('GET /api/user/'+req.params.id);

		knex.select('username', 'publickey').from('users').where('id', req.params.id)
		.then(function(rows){
			if(rows.length == 0){
				console.log('GET /api/user/%d found no user in the database.', req.params.id);
				return next( new restify.errors.NotFoundError('Username not found'));
			}

			if( rows.length > 1 ){
				console.log('GET /api/user/%d found several users. Catastrophic error.', req.params.id);
				return next( new restify.errors.InternalServerError('Catastropic internal server error.'));
			}

			res.send(200, rows[0]);
			return next();
		});
	})

	server.post('/api/user', function(req, res, next){
		console.log("POST /api/user %j", req.body.username);	
		/*
			Request Content
			Username: String
			Password: String
			PrivateKey: Binary
			PublicKey: String
		*/	

		// Validate Input
		if( req.body.username === undefined || req.body.username === '' || !validator.isAlphanumeric(req.body.username) ){
			console.log("POST /api/user Missing username");
			return next(new restify.errors.BadRequestError("Incomplete request: Missing username"));

		}

		if( req.body.password === undefined || req.body.password === '' ){
			console.log("POST /api/user Missing password");
			return next(new restify.errors.BadRequestError("Incomplete request: Missing password"));
		}

		if( req.body.privatekey === undefined || req.body.privatekey === '' ){
			console.log("POST /api/user Missing private key");
			return next(new restify.errors.BadRequestError("Incomplete request: Missing private key"));
		}

		if( req.body.publickey === undefined || req.body.publickey === '' ){
			console.log("POST /api/user Missing public key");
			return next(new restify.errors.BadRequestError("Incomplete request: Missing public key"));
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

				var base64encoded = {
					publickey : base64.encode(req.body.publickey)
				}

				knex('users').insert({username: req.body.username, password: hash, salt: salt, privatekey: req.body.privatekey, publickey: req.body.publickey})
				.then(function(rows){
					console.log("POST /api/user DB insert: %s", rows);
					res.send(200, 'OK');
					return next();
				})
				.catch(function(error){
					// SQLite Username Exists error
					if( error.errno == 19 && error.code === 'SQLITE_CONSTRAINT' ){
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

	server.get('/api/user/:id/publickey', function(req, res, next){
		next(new restify.errors.NotImplementedError("API endpoint not implemented yet."));
	})
};