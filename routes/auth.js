const fs 				= require('fs');

const restify 			= require('restify');

const bcrypt 			= require('bcrypt');
const argon2 			= require('argon2');
const validator			= require('validator');

const authHelpers 		= require(__base + '/helpers/authHelpers.js');



module.exports = function(server, knex){
	server.post('/api/auth/login', function(req, res, next){

		if( req.body.username === undefined || req.body.username === '' || !validator.isAlphanumeric(req.body.username) ){
			console.log("POST /api/auth/login Missing username");
			return next(new restify.errors.BadRequestError("Incomplete request: Missing username"));
		}

		if( req.body.password === undefined || req.body.password === '' ){
			console.log("POST /api/auth/login Missing password");
			return next(new restify.errors.BadRequestError("Incomplete request: Missing password"));
		}

		knex.select('id', 'username', 'password', 'salt').from('users').where({'username':req.body.username})
		.then(function(rows){
			if( rows.length == 0 ){
				// No user was found with that username.
				console.log("POST /api/auth/login Wrong Username");
				return next(new restify.errors.UnauthorizedError());
			}
			if( rows.length > 1 ){
				console.log("POST /api/auth/login Something went horribly wrong...");
				return next(new restify.errors.InternalServerError("Error during authentication."));
			}

			//argon2.encrypt(req.body.password, rows[0].salt, {argon2d: false}, function(err, hash){
			bcrypt.hash(req.body.password, rows[0].salt, function(err, hash){
				if(err){
					console.log("POST /api/auth/login BCrypt error.");
					return next( new restify.errors.InternalServerError("Error in crypto librari.") );
				}
				req.body.password = '';

				if(err){
					console.log("POST /api/auth/login Argon2 encryption error.\n%j", err);
					return next(new restify.errors.InternalServerError("Error during authentication."));
				}
				if( hash !== rows[0].password ){
					// Login failed
					return next(new restify.errors.UnauthorizedError());
				}

				console.log('Authenticated user %s.', rows[0].username);

				// Login Succeeded
				res.send(200, {token: authHelpers.createJWT(rows[0]) });
			});
		});
	});
}