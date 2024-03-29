const fs 							= require('fs');
const restify 						= require('restify');
const crypto 						= require('crypto');
const bcrypt 						= require('bcrypt');
const schemagic 					= require('schemagic');
const _								= require('underscore');


const base64 						= require(__base + 'helpers/base64.js');

// Middleware
const authentication 				= require(__base + 'middlewares/authentication.js');
const authorization  				= require(__base + 'middlewares/authorization.js');
const resolve 						= require(__base + 'middlewares/resolve.js');
const authorization2  				= require(__base + 'middlewares/test.authorization.js');

// Models
const Audit							= require(__base + 'models/audit.js');

// Errors
const UnauthorizedError 			= require(__base + 'errors/UnauthorizedError.js');
const UserDoesNotExistError 		= require(__base + 'errors/UserDoesNotExistError.js');
const PasswordDoesNotExistError 	= require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 				= require(__base + 'errors/ValidationError.js');
const SqlError 						= require(__base + 'errors/SqlError.js');
const AlreadyExistError 			= require(__base + 'errors/Internal/AlreadyExistError.js');
const ThisIsClearlyAPotatoError 	= require(__base + 'errors/ThisIsClearlyAPotatoError.js');


//const Promise 			= require('bluebird');
//Promise.onPossiblyUnhandledRejection(function(error){
//    throw error;
//});



// Models
var User = require(__base + 'models/user.js');


module.exports = function(server, log){

	var knex = require(__base + 'database.js')();

	server.get('/api/users', authentication, function(req, res, next){
		log.info({ method: 'GET', path: '/api/users' });
	
		User.findAll()
		.then(function(users){
			res.send(200, users);
			Audit.report(req.resolved.user, req, 'User Collection', undefined, 'READ');
			return next();
		})
		.catch(SqlError, function(err){
			console.log(err);
			res.send(500, 'Internal database error');
			return next();
		});
	});
	
	server.get('/api/users/me', authentication, authorization2({object: 'user', method: 'get/me'}), function(req, res, next){
		log.info({ method: 'GET', path: '/api/users/me/' });
		
		//res.send(200, _.pick(req.resolved.user, ['privatekey', 'iv']));
		res.send(200, _.omit(req.resolved.user, ['password', 'salt', 'two_factor_secret']));
		Audit.report(req.resolved.user, req, 'User', req.resolved.user.id, 'READ');

		return next();
	});

	server.get('/api/users/:userId', authentication, resolve, authorization2({object: 'user', method: 'get'}), function(req, res, next){
		log.info({ method: 'GET', path: '/api/user/'+req.params.userId });

		res.send(200, _.pick(req.resolved.user, ['id', 'username', 'publickey']));
		Audit.report(req.resolved.user, req, 'User', req.resolved.params.user.id, 'READ');
		Audit.report(req.resolved.params.user, req, 'User', req.resolved.user.id, 'READ');


		return next();
	});

	/*server.post('/api/users/:userId/promote', authentication, resolve, authorization({object: 'user', method:'promote'}), function(req, res, next){

	});*/

	server.post('/api/users', authentication, authorization2({object: 'user', method: 'create'}), function(req, res, next){
		log.info({ method: 'POST', path: '/api/user', payload: req.body.username });
		/*
			Request Content
			Username: String
			Password: String
			PrivateKey: Base64
			iv: Base64
			Pk_Salt: Base64
			PublicKey: Base64
		*/	
		// Validate Input
		User.create(req.body)
		.then(function(user){
			res.send(200, {message: 'OK', id: user.id});
			Audit.report(req.resolved.user, req, 'User', user.id, 'CREATE');
			return next();
		})
		.catch(AlreadyExistError, function(err){
			return next( new restify.errors.BadRequestError(err.message) );
		})
		.catch(ValidationError, function(err){
			var parsedErrors = [];
			for( var i = 0 ; i < err.errors.length ; i++ ){				
				parsedErrors.push({ field: (err.errors[i].property).split('.')[1], error: err.errors[i].message } );
			}
			res.send(400, {error:'validation', errors:parsedErrors});
			return next();
		})
		.catch(SqlError, function(err){
			res.send(400, err.message);
			return next();
		});
	});	

	server.put('/api/users/:userId', authentication, resolve, authorization2({object: 'user', method: 'update'}), function(req, res, next){
		log.info({ method: 'PUT', path: '/api/user/'+req.params.userId, payload: req.body, auth: req.user });
			
		//(req.resolved.user).update(req.body)
		/*User.find(req.params.userId)
		.then(function(user){
			return user.update(req.body);
		})*/
		(req.resolved.params.user).update(req.body)
		.then(function(udpdatedUser){
			res.send(200, 'OK');
			Audit.report(req.resolved.user, req, 'User', req.resolved.params.user.id, 'UPDATE');

			return next();
		})
		.catch(UserDoesNotExistError, function(err){
			res.send(404, {error: 'User does not exist'});
			return next();
		})
		.catch(ValidationError, function(err){
			var parsedErrors = [];
			for( var i = 0 ; i < err.errors.length ; i++ ){
				var t = (err.errors[i].property).split('.');
				var field = t.length === 2 ? t[1] : t[0];
				parsedErrors.push({ field: field, error: err.errors[i].message } );
			}
			res.send(400, {error:'validation', errors:parsedErrors});
			return next();
		});
	});

	server.del('/api/users/:userId', authentication, resolve, authorization2({object: 'user', method: 'delete'}), function(req, res, next){
		log.info({ method: 'DEL', path: '/api/user/'+req.params.userId, payload: req.body, auth: req.user });
		
		(req.resolved.params.user).del()
		.then(function(success){
			if(success){
				res.send(200, 'OK');
				//Audit.report(req.resolved.user, req, 'User', req.resolved.params.user.id, 'DELETE');
	
			}else{
				res.send(400, 'error');
			}
			
			return next();
		})
		.catch(UserDoesNotExistError, function(err){
			res.send(400, 'User ID ' + req.params.userId + ' was not found');
			return next();
		})
		.catch(SqlError, function(err){
			log.error({method: 'DEL', path: '/api/user'+req.params.userId, error: err});
			res.send(500, 'Internal database error');
			return next();
		})
		.catch(ValidationError, function(err){
			var parsedErrors = [];
			for( var i = 0 ; i < err.errors.length ; i++ ){				
				parsedErrors.push({ field: (err.errors[i].property).split('.')[1], error: err.errors[i].message } );
			}
			res.send(400, {error:'validation', errors:parsedErrors});
			return next();
		});
	});	

};