const fs 			= require('fs');
const restify 		= require('restify');
const validator 	= require('validator');
const crypto 		= require('crypto');
const bcrypt 		= require('bcrypt');
const argon2 		= require('argon2');

const validate 		= require(__base + 'helpers/validate.js');
const base64 		= require(__base + 'helpers/base64.js');
const authHelpers	= require(__base + 'helpers/authHelpers.js');
const authorized 	= require(__base + 'helpers/authorization.js');


const UnauthorizedError 		= require(__base + 'errors/UnauthorizedError.js');
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const PasswordDoesNotExistError 	= require(__base + 'errors/PasswordDoesNotExistError.js');


// Models
var User = require(__base + 'models/user.js');


module.exports = function(server, log){

	var knex = require(__base + 'database.js')();

	server.get('/api/users', function(req, res, next){
		log.info({ method: 'GET', path: '/api/users' });

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

	server.post('/api/user', function(req, res, next){
		log.info({ method: 'POST', path: '/api/user', payload: req.body.username });
		/*
			Request Content
			Username: String
			Password: String
			PrivateKey: Binary
			PublicKey: String
		*/	
		// Validate Input
		var user = User.create(req.body);
	});

	server.put('/api/user/:id', function(req, res, next){

		if( !validate.ID(req.params.id) ){
			return next(new restify.errors.BadRequestError('Incomplete request: Invalid ID'));
		}

		log.info({ method: 'PUT', path: '/api/user/'+req.params.id, payload: req.body, auth: req.user });

	});

	server.del('/api/user/:id', authHelpers.ensureAuthenticated, function(req, res, next){
 	

	});	

	server.get('/api/user/:id', function(req, res, next){
	
	});

	server.get('/api/user/:id/publickey', function(req, res, next){
		log.info({ method: 'POST', path: '/api/user/:id/publickey', payload: req.params.id });

		if( !validate.id( req.params.id ) ){
			log.debug({ method: 'POST', path: '/api/user/:id/publickey', payload: req.params.id, message: 'Invalid user ID' });
			return next(new restify.errors.BadRequestError("Incomplete request: Invalid user ID"));
		}

		knex.select('publickey').from('users').where('id', req.params.id)
		.then(function(rows){
			if( rows < 1 ){
				log.debug({ method: 'POST', path: '/api/user/:id/publickey', payload: req.params.id, message: 'User ID not found' });
				return next( new restify.errors.NotFoundError('User ID not found') );
			}

			if( rows > 1 ){
				log.error({ method: 'POST', path: '/api/user/:id/publickey', payload: req.params.id, message: 'Multiple users found with same ID.' });
				return next( new restify.errors.InternalServerError('Catastropic internal database error') );
			}

			res.send(200, rows[0].publickey);
			return next();

		})
		.catch(function(err){
			log.debug({ method: 'POST', path: '/api/user/:id/publickey', payload: req.params.id, message: 'Database error', error: err });
			return next( new restify.errors.InternalServerError('Undefined database error') );
		});
	});
};