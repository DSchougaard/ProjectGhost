'use strict'
const fs 						= require('fs');
		
const restify 					= require('restify');
const speakeasy		 			= require("speakeasy");
const bcrypt 					= require('bcrypt');
const validator					= require('validator');
		
const authHelpers 				= require(__base + '/helpers/authHelpers.js');

// Models
const User 						= require(__base + '/models/user.js');

// Middleware
const authentication 			= require(__base + 'middlewares/authentication.js');
const authorization  			= require(__base + 'middlewares/authorization.js');
const testauthorization 		= require(__base + 'middlewares/test.authorization.js');
const resolve 					= require(__base + 'middlewares/resolve.js');

// Errors
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const InviteDoesNotExistError 	= require(__base + 'errors/InviteDoesNotExistError.js');
const InvalidInviteError 		= require(__base + 'errors/InvalidInviteError.js');
const OperationalError 			= Promise.OperationalError;
const AlreadyExistError 		= require(__base + 'errors/Internal/AlreadyExistError.js');

// Rest Errors
const ValidationRestError 		= require(__base + 'errors/ValidationRestError.js');


class TwoFactor{
	constructor(data){
		var self = this;
	
		// Temporary Cachce to store 2FA Secrets in, until first authentication
		self.cache = {};
	}

	generate(id){
		var secret = speakeasy.generateSecret();

		// Cache Value for First Auth attempt.
		tempSecrets[req.resolved.user.id] = secret.base32;
		return secret.otpauth_url;
	}

	getSecret(id){

	}

	internalVerify(base32secret, token){
		return speakeasy.totp.verify({ 	secret: base32secret,
	                                   	encoding: 'base32',
	                                    token: token });

	}

	verify(user, token){

		/*
			Cases:
			1. User has no secret key, and temp does not exists -- ERROR!?
			2. User has no secret key, and temp exists -- verify and update user
			3. User has secret key, and temp does not exist -- verify db
			4. User has secret key, and temp exists -- verify and update
		*/

		if( !user.twoFactorEnabled ){
			// Error?!
		}

		var secret = undefined;

		// Do stuff here


		// Verify token and update user to use this
		if( self.internalVerify(secret, token) ){

		}else{

		}

	}

}

var twoFactor = new TwoFactor();


var tempSecrets 			= {};

	
module.exports = function(server, knex, log){
	server.post('/api/auth/login', function(req, res, next){
		log.info({ method: 'POST', path: '/api/auth/login', payload: req.body.username });

		// Filter bad requests based on the username
		if( req.body.username === undefined || req.body.username === '' /*|| !validator.isAlphanumeric(req.body.username)*/ ){
			log.debug({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Missing username'});
			return next(new restify.errors.BadRequestError("Incomplete request: Missing username"));
		}

		// Filter bad requests based on the password
		if( req.body.password === undefined || req.body.password === '' ){
			log.debug({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Missing password'});
			return next(new restify.errors.BadRequestError("Incomplete request: Missing password"));
		}

		knex.select('id', 'username', 'password', 'salt', 'isAdmin').from('users').where({'username':req.body.username})
		.then(function(rows){
			if( rows.length == 0 ){
				// No user was found with that username.
				log.debug({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Wrong Username'});
				return next(new restify.errors.UnauthorizedError('Wrong login credentials'));
			}
			if( rows.length > 1 ){
				log.error({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Several user IDs found for same username. Fatal error.'});
				return next(new restify.errors.InternalServerError());
			}

			if( rows[0].twoFactorEnabled && !req.body.twoFactorSecret ){
				return next(new restify.errors.ForbiddenError('Missing two factor token') );
			}

			bcrypt.hash(req.body.password, rows[0].salt, function(err, hash){
				if(err){
					log.error({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'BCrypt error', error: err});
					return next( new restify.errors.InternalServerError() );
				}
				req.body.password = '';

				if( hash !== rows[0].password ){
					// Login failed
					log.info({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Login failed'});
					return next(new restify.errors.UnauthorizedError('Wrong login credentials'));
				}



				log.info({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Login successful'});

				// Login Succeeded
				res.send(200, {token: authHelpers.createJWT(rows[0]) });
			});
		});
	});

	server.get('/api/auth/ping', authHelpers.ensureAuthenticated, function(req, res, next){
		res.send(200, 'OK');
		return next();
	});

	server.post('/api/auth/hotp/generate', authentication, function(req, res, next){
		var secret = speakeasy.generateSecret();

		// Cache Value for First Auth attempt.
		tempSecrets[req.resolved.user.id] = secret.base32;

		res.send(200, secret.otpauth_url);
		return next();
	});

	server.post('/api/auth/hotp/verify', authentication, function(req, res, next){

		var userToken = req.body;	

		/*
			Cases:
			User has no secret key, and temp does not exists -- ERROR!?
			User has no secret key, and temp exists -- verify and update user
			User has secret key, and temp does not exist -- verify db
			User has secret key, and temp exists -- verify and update
		*/

		// Fetch key
		if( tempSecrets[req.resolved.user.id] === undefined ){
			return next( new restify.errors.BadRequestError('Two factor secret missing') );
		}


		var base32secret = tempSecrets[req.resolved.user.id];
		var verified = speakeasy.totp.verify({ secret: base32secret,
	                                       encoding: 'base32',
	                                       token: userToken });
		
		if( verified ){

			req.resolved.user.update({twoFactorEnabled: true, twoFactorSecret: base32secret})
			.then(function(user){
				res.send(200, 'OK');
				return next();

			})
			.catch(ValidationError, function(err){
				return next( new ValidationRestError('Validation error', err.errors));
			})
			.catch(SqlError, function(err){
				res.send(500, 'Internal database error');
				log.error({method: 'POST', path: '/api/password', payload: password, error: err});
				return next();
			});
			
		}

		return next( new restify.errors.BadRequestError('Invalid token') );
	});
}