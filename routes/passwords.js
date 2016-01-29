const restify 			= require('restify');
const knex 				= require('knex');
const _ 				= require('underscore');

const authHelpers 		= require(__base + 'helpers/authHelpers.js');
const constants 		= require(__base + 'helpers/constants.json');

const Password 			= require(__base + 'models/password.js');
const User 				= require(__base + 'models/user.js');

// Errors
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');

// Middleware
const authorized 			= require(__base + 'middlewares/authorization.js');

module.exports = function(server, knex, log){

	server.get('/api/users/:userId/passwords', authHelpers.ensureAuthenticated, function(req, res, next){
		log.info({ method: 'GET', path: '/api/passwords', payload: req.user });

		User.find(req.params.userId)
		.then(Password.findAll)
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

	server.get('/api/users/:userId/passwords/:passwordId', authHelpers.ensureAuthenticated, authorized, function(req, res, next){
		
		User.find(req.params.userId)
		.then(function(user){
			// Auth thingy
			return Password.find(req.params.passwordId);
		})
		.then(function(password){
			res.send(200, password);
			return next();
		})
		.catch(UserDoesNotExistError, function(err){
			res.send(404, {error: 'User does not exist'});
			return next();
		})
		.catch(PasswordDoesNotExistError, function(err){
			res.send(404, {error:'Password was not found'});
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
		})
		.catch(SqlError, function(err){
			res.send(500, 'Internal database error');
			log.error({method: 'POST', path: '/api/password', payload: password, error: err});
			return next();
		});		
	});

	server.post('/api/users/:userId/passwords', authHelpers.ensureAuthenticated, function(req, res, next){
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

		var password 	= _.pick(req.body, ['title', 'username', 'iv', 'password', 'parent', 'note']);
		password.owner 	= req.params.userId;
		password 		= _.defaults(password, {parent: null, note: null});


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

	
	server.del('/api/users/:userId/passwords/:passwordId', authHelpers.ensureAuthenticated, function(req, res, next){
		log.info({ method: 'DEL', path: '/api/passwords', payload: req.params.passwordId });

		User.find(req.params.userId)
		.then(function(user){
			// Do some authorization check?!
			return Password.find(req.params.passwordId);
		})
		.then(function(password){
			log.info({ method: 'DEL', path: '/api/passwords', message: 'Deleting password', id: password.id });
			password.del();
			res.send(200, 'OK');
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

	server.put('/api/users/:userId/passwords/:passwordId', authHelpers.ensureAuthenticated, function(req, res, next){
		log.info({ method: 'PUT', path: '/api/passwords', id: req.params.passwordId, payload: req.body });

		User.find(req.params.userId)
		.then(function(user){
			// Do some authorization
			return Password.find(req.params.passwordId);
		})
		.then(function(password){
			return password.update(req.body);
		})
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
			var parsedErrors = [];
			for( var i = 0 ; i < err.errors.length ; i++ ){
				var t = (err.errors[i].property).split('.');
				var field = t.length === 2 ? t[1] : t[0];
				parsedErrors.push({ field: field, error: err.errors[i].message } );
			}
			res.send(400, {error:'validation', errors:parsedErrors});
			return next();
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

}