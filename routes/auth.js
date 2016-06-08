'use strict'
const fs 						= require('fs');
const Promise 					= require('bluebird');
const restify 					= require('restify');
const speakeasy		 			= require("speakeasy");
const bcrypt 					= require('bcrypt');
const argon2 					= require('argon2');
//argon2.Promise 					= Promise;

const authHelpers 				= require(__base + '/helpers/authHelpers.js');

// Models
const User 						= require(__base + '/models/user.js');
const Audit						= require(__base + 'models/audit.js');

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

var tempSecrets 			= {};




	

var Ajv 			= require('ajv');
var ajv 			= new Ajv;

var schemas 		= {};
schemas.login 		= {
	$async: true,
	properties: {
		username:{
			type: "string"
		},
		password:{
			type:"string"
		}
	}
}

var validate 		= {}
validate.login 		= ajv.compile(schemas.login);


module.exports = function(server, knex, log){

	server.post('/experimental/api/auth/login', function(req, res, next){
		log.info({ method: 'POST', path: '/api/auth/login', payload: req.body.username });
		validate.login(req.body)
		.then(function(){ return knex('users').select().where({'username':req.body.username}) } )
		.then(function(rows){

			if( rows.length == 0 ){
				// No user was found with that username.
				log.debug({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Wrong Username'});
				return next(new restify.errors.UnauthorizedError('Wrong login credentials'));
			}
			if( rows.length > 1 ){
				log.error({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Several user IDs found for same username. Fatal error.'});
				return next(new restify.errors.InternalServerError('Catastrophic DB error. Multiple users with same ID found.'));
			}

			// User has chosen to enable two factor, but no secret exists in db
			if( rows[0].two_factor_enabled && (rows[0].two_factor_secret === undefined || rows[0].two_factor_secret === null) ){
				return next( new restify.errors.InternalServerError('Misconfiguration of Two Factor authentication. Please generate new secret.'));
			}

			// User has chosen to enable two factor, but no token was passed in URL.
			if( rows[0].two_factor_enabled && !req.body.twoFactorToken ){
				return next(new restify.errors.ForbiddenError('Missing two factor token') );
			}

			// User has not enabled 2FA but passs token anyway
			if( !rows[0].two_factor_enabled && req.body.twoFactorToken ){
				return next( new restify.errors.BadRequestError('User has not enabled two-factor authentication') );
			}

			return Promise.all([ argon2.verify(rows[0].password, req.body.password), new Promise.resolve(rows) ]);
			//return argon2.verify(rows[0].password, req.body.password).bind(null, rows);
		})
		.then(function(args){
			var match 	= args[0];
			var rows 	= args[1];

			if(!match){
				log.info({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Login failed'});
				Audit.report(rows[0], req, 'Authentication (Invalid Credentials)', undefined, 'FAILURE');
				return next(new restify.errors.UnauthorizedError('Wrong login credentials'));
			}

			if( rows[0].two_factor_enabled ){
				var valid = speakeasy.totp.verify({	secret: rows[0].two_factor_secret,
                                   					encoding: 'base32',
                                    				token: req.body.twoFactorToken });

				if( !valid ){
					Audit.report(rows[0], req, 'Authentication (Invalid Token)', undefined, 'FAILURE');
					return next(new restify.errors.UnauthorizedError('Wrong login credentials'));
				}
			}


			log.info({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Login successful'});
			// Login Succeeded
			res.send(200, {token: authHelpers.createJWT(rows[0]) });
			if( rows[0].two_factor_enabled ){
				Audit.report(rows[0], req, 'Authenticated with Two Factor Authentication', undefined, 'SUCCESS');
			}else{
				Audit.report(rows[0], req, 'Authenticated', undefined, 'SUCCESS');
			}
			return next();
		});
	});

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

		return knex('users').select().where({'username':req.body.username})
		.then(function(rows){
			if( rows.length == 0 ){
				// No user was found with that username.
				log.debug({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Wrong Username'});
				return next(new restify.errors.UnauthorizedError('Wrong login credentials'));
			}
			if( rows.length > 1 ){
				log.error({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Several user IDs found for same username. Fatal error.'});
				return next(new restify.errors.InternalServerError('Catastrophic DB error. Multiple users with same ID found.'));
			}

			// User has chosen to enable two factor, but no secret exists in db
			if( rows[0].two_factor_enabled && (rows[0].two_factor_secret === undefined || rows[0].two_factor_secret === null) ){
				return next( new restify.errors.InternalServerError('Misconfiguration of Two Factor authentication. Please generate new secret.'));
			}

			// User has chosen to enable two factor, but no token was passed in URL.
			if( rows[0].two_factor_enabled && !req.body.twoFactorToken ){
				return next(new restify.errors.ForbiddenError('Missing two factor token') );
			}

			// User has not enabled 2FA but passs token anyway
			if( !rows[0].two_factor_enabled && req.body.twoFactorToken ){
				return next( new restify.errors.BadRequestError('User has not enabled two-factor authentication') );
			}

			return argon2.verify(rows[0].password, req.body.password).then(match => {
				if (!match) {
					log.info({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Login failed'});
					Audit.report(rows[0], req, 'Authentication (Invalid Credentials)', undefined, 'FAILURE');
					return next(new restify.errors.UnauthorizedError('Wrong login credentials'));
				}

				if( rows[0].two_factor_enabled ){
					var valid = speakeasy.totp.verify({	secret: rows[0].two_factor_secret,
	                                   					encoding: 'base32',
	                                    				token: req.body.twoFactorToken });

					if( !valid ){
						Audit.report(rows[0], req, 'Authentication (Invalid Token)', undefined, 'FAILURE');
						return next( new restify.errors.UnauthorizedError('Invalid token') );
					}
				}

				log.info({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Login successful'});

				// Login Succeeded
				res.send(200, {token: authHelpers.createJWT(rows[0]) });


				if( rows[0].two_factor_enabled ){
					Audit.report(rows[0], req, 'Authenticated with Two Factor Authentication', undefined, 'SUCCESS');
				}else{
					Audit.report(rows[0], req, 'Authenticated', undefined, 'SUCCESS');
				}

				return next();
			})
		});
	});

	server.get('/api/auth/ping', authentication, function(req, res, next){
		res.send(200, 'OK');
		return next();
	});

	server.post('/api/auth/totp/generate', authentication, function(req, res, next){
		var secret = speakeasy.generateSecret();

		// Cache Value for First Auth attempt.
		tempSecrets[req.resolved.user.id] = secret.base32;

		res.send(200, secret.otpauth_url);
		return next();
	});

	server.post('/api/auth/totp/verify', authentication, function(req, res, next){

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
			return next( new restify.errors.NotFoundError('Found no secret to verify') );
		}


		var base32secret = tempSecrets[req.resolved.user.id];
		var verified = speakeasy.totp.verify({ secret: base32secret,
	                                       encoding: 'base32',
	                                       token: userToken });
		
		if( verified ){
			req.resolved.user.update({two_factor_enabled: true, two_factor_secret: base32secret})
			.then(function(user){
				// Clear secret from cache
				tempSecrets[req.resolved.user.id] = undefined;
				// Send OK!
				res.send(200, 'OK');
				Audit.report(req.resolved.user, get_ip(req).clientIp, 'User', user.id, 'UPDATE');

				return next();

			})
			.catch(ValidationError, function(err){
				return next( new ValidationRestError('Validation error', err.errors));
			})
			.catch(SqlError, function(err){
				log.error({method: 'POST', path: '/api/password', payload: password, error: err});
				return next( new restify.errors.InternalServerError(err) );
			});
			
		}else{
			return next( new restify.errors.BadRequestError('Invalid token') );	
		}


	});
}