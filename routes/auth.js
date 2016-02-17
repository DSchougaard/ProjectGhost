const fs 				= require('fs');

const restify 			= require('restify');

const bcrypt 			= require('bcrypt');
const validator			= require('validator');

const authHelpers 		= require(__base + '/helpers/authHelpers.js');


module.exports = function(server, knex, log){
	server.post('/api/auth/login', function(req, res, next){
		log.info({ method: 'POST', path: '/api/auth/login', payload: req.body.username });

		// Filter bad requests based on the username
		if( req.body.username === undefined || req.body.username === '' || !validator.isAlphanumeric(req.body.username) ){
			log.debug({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Missing username'});
			return next(new restify.errors.BadRequestError("Incomplete request: Missing username"));
		}

		// Filter bad requests based on the password
		if( req.body.password === undefined || req.body.password === '' ){
			log.debug({ method: 'POST', path: '/api/auth/login', payload: req.body.username, message: 'Missing password'});
			return next(new restify.errors.BadRequestError("Incomplete request: Missing password"));
		}

		knex.select('id', 'username', 'password', 'salt').from('users').where({'username':req.body.username})
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
}