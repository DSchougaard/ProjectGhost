const restify 			= require('restify');
const knex 				= require('knex');
const _ 				= require('underscore');

const authHelpers 		= require(__base + 'helpers/authHelpers.js');
const constants 		= require(__base + 'helpers/constants.json');

const Password 			= require(__base + 'models/password.js');
const User 				= require(__base + 'models/user.js');
const SharedPassword 	= require(__base + 'models/sharedPassword.js');

// Errors
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');
const ValidationRestError 		= require(__base + 'errors/ValidationRestError.js');

// Middleware
const authentication 	= require(__base + 'middlewares/authentication.js');
const authorization  	= require(__base + 'middlewares/authorization.js');
const resolve 			= require(__base + 'middlewares/resolve.js');

module.exports = function(server, knex, log){



	server.get('/api/users/:userId/passwords/shares',authentication, resolve, authorization, function(req, res, next){
		SharedPassword.findAllSharedToMe(req.resolved.params.user)
		.then(function(shares){
			res.send(200, shares);
			return next();
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(UserDoesNotExistError, PasswordDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError(err.message) );
		})
		.catch(SqlError, function(err){
			res.send(500, 'Internal database error');
			log.error({method: 'POST', path: '/api/password', payload: password, error: err});
			return next();
		});
	});

	/*
		Own Password Routes
	*/
	server.get('/api/users/:userId/passwords', authentication, resolve, authorization, function(req, res, next){
		log.info({ method: 'GET', path: '/api/passwords', payload: req.user });
		log.debug({ request: req });

		Password.findAll(req.resolved.user)
		.then(function(passwords){
			res.send(200, passwords);
			return next();
		})
		.catch(UserDoesNotExistError, function(err){
			res.send(404, {error: 'User does not exist'});
			return next();
		})
		.catch(PasswordDoesNotExistError, function(err){
			res.send(404, {error: 'Password does not exist'});
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
	});

	server.get('/api/users/:userId/passwords/:passwordId', authentication, resolve, authorization, function(req, res, next){
		res.send(200, req.resolved.params.password);
		return next();
	});

	server.post('/api/users/:userId/passwords', authentication, resolve, authorization, function(req, res, next){
		log.info({ method: 'POST', path: '/api/passwords', payload: req.body });
		/*
			Content:
			-------
			title
			username
			iv
			password (blob)
			
			Optional Content:
			-------
			parent
			note
		*/

		//var password 	= _.pick(req.body, ['title', 'username', 'iv', 'password', 'parent', 'url', 'note']);
		var password 	= _.clone(req.body);
		password.owner 	= req.resolved.user.id;
		password 		= _.defaults(password, {parent: null, note: null, url: null});


		Password.create(password)
		.then(function(password){
			log.info({ method: 'POST', path: '/api/password', user: req.user, message: 'Password added' });
			res.send(201, {message: 'OK', id: password.id});
			return next();
		})
		.catch(UserDoesNotExistError, function(err){
			res.send(404, {error: 'User does not exist'});
			return next();
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
			res.send(500, 'Internal database error');
			log.error({method: 'POST', path: '/api/password', payload: password, error: err});
			return next();
		});
	});


	server.del('/api/users/:userId/passwords/:passwordId', authentication, resolve, authorization, function(req, res, next){
		log.info({ method: 'DEL', path: '/api/passwords', payload: req.params.passwordId });

		(req.resolved.params.password).del()
		.then(function(password){
			res.send(200, 'OK');
			return next();
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));

		})
		.catch(UserDoesNotExistError, function(err){
			res.send(404, {error: 'User does not exist'});
			return next();
		})
		.catch(PasswordDoesNotExistError, function(err){
			res.send(404, {error: 'Password was not found'});
			return next();
		})
		.catch(SqlError, function(err){
			res.send(500, 'Internal database error');
			log.error({method: 'POST', path: '/api/password', payload: password, error: err});
			return next();
		});
	});

	server.put('/api/users/:userId/passwords/:passwordId', authentication, resolve, authorization, function(req, res, next){
		log.info({ method: 'PUT', path: '/api/passwords', id: req.params.passwordId, payload: req.body });

		(req.resolved.params.password).update(req.body)
		.then(function(success){
			if( success ){
				res.send(200, 'OK');
			}else{
				// Not expected...
				res.send(500, 'Error updating user');
			}
			return next();
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(UserDoesNotExistError, function(err){
			res.send(404, {error: 'User does not exist'});
			return next();
		})
		.catch(PasswordDoesNotExistError, function(err){
			res.send(404, 'Password was not found');
			return next();
		})
		.catch(SqlError, function(err){
			res.send(500, 'Internal database error');
			log.error({method: 'POST', path: '/api/password', payload: password, error: err});
			return next();
		});
	});

	/*
		Password Sharing Routes
	*/

	server.post('/api/users/:userId/passwords/:passwordId/shares', authentication, resolve, authorization, function(req, res, next){
		var data 				= req.body;
		data.origin_password 	= req.resolved.params.password.id;
		data.origin_owner 		= req.resolved.params.user.id;

		console.log("%j", data);

		SharedPassword.create(data)
		.then(function(shared){
			res.send(200, shared);
			return next();
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(UserDoesNotExistError, PasswordDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError(err.message) );
		})
		.catch(SqlError, function(err){
			res.send(500, 'Internal database error');
			log.error({method: 'POST', path: '/api/password', payload: password, error: err});
			return next();
		});
	});

	server.get('/api/users/:userId/passwords/:passwordId/shares', authentication, resolve, authorization, function(req, res, next){

		req.resolved.params.password.sharedWith()
		.then(function(users){
			console.log("%j", users);
			res.send(200, users);
			return next();
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(UserDoesNotExistError, PasswordDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError(err.message) );
		})
		.catch(SqlError, function(err){
			return next( new restify.errors.InternalServerError(err.message) );
		})
		.catch(function(err){
			console.log(err);
		})
	});


	server.put('/api/users/:userId/passwords/shares/:shareId', authentication, resolve, authorization, function(req, res, next){
		req.resolved.params.share.update(req.body)
		.then(function(res){
			res.send(200, res);
			return next();
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(UserDoesNotExistError, PasswordDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError(err.message) );
		})
		.catch(SqlError, function(err){
			res.send(500, 'Internal database error');
			log.error({method: 'POST', path: '/api/password', payload: password, error: err});
			return next();
		});
	});


	server.get('/api/users/:userId/passwords/shared', authentication, resolve, authorization, function(req, res, next){
		SharedPassword.findSharedFromMe(req.resolved.params.user)
		.then(function(shared){
			res.send(200, shared);
			return next();
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(UserDoesNotExistError, PasswordDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError(err.message) );
		})
		.catch(SqlError, function(err){
			res.send(500, 'Internal database error');
			log.error({method: 'POST', path: '/api/password', payload: password, error: err});
			return next();
		});
	});

	server.del('/api/users/:userId/passwords/shares/:shareId', authentication, resolve, authorization, function(req, res, next){
		req.resolved.params.share.del()
		.then(function(r){
			res.send(200, r);
			return next();
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(UserDoesNotExistError, PasswordDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError(err.message) );
		})
		.catch(SqlError, function(err){
			res.send(500, 'Internal database error');
			log.error({method: 'POST', path: '/api/password', payload: password, error: err});
			return next();
		});
	});
}