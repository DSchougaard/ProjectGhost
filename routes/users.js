const fs 			= require('fs');
const restify 		= require('restify');
const validator 	= require('validator');
const crypto 		= require('crypto');
const bcrypt 		= require('bcrypt');
const argon2 		= require('argon2');

const validate 		= require(__base + 'helpers/validate.js');
const base64 		= require(__base + 'helpers/base64.js');
const authHelpers	= require(__base + 'helpers/authHelpers.js');

module.exports = function(server, knex, log){
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


		if( !validate.username(req.body.username) ){
			log.debug({ method: 'POST', path: '/api/user', message: 'Missing username' });
			return next(new restify.errors.BadRequestError("Incomplete request: Missing username"));
		}

		if( !validate.password(req.body.password) ){
			log.debug({ method: 'POST', path: '/api/user', message: 'Missing password' });
			return next(new restify.errors.BadRequestError("Incomplete request: Missing password"));
		}

		if( !validate.privateKey(req.body.privatekey) ){
			log.debug({ method: 'POST', path: '/api/user', message: 'Missing private key' });
			return next(new restify.errors.BadRequestError("Incomplete request: Missing private key"));
		}

		if( !validate.publicKey(req.body.publickey) ){
			log.debug({ method: 'POST', path: '/api/user', message: 'Missing public key' });
			return next(new restify.errors.BadRequestError("Incomplete request: Missing public key"));
		}

		// Generating a secure salt
		bcrypt.genSalt(function(err, salt){
			if(err){
				log.error({ method: 'POST', path: '/api/user', message: 'Error generating salt', error: err });
				next(new restify.errors.InternalServerError("Error generating salt"));
			}

			// Hashing the password
			bcrypt.hash(req.body.password, salt, function(err, hash){
				req.body.password = '';

				if(err){
					log.error({ method: 'POST', path: '/api/user', message: 'Error in producing hash of input', error: err });
					return next(new restify.errors.InternalServerError("Error in crypto libraries"));
				}

				var base64encoded = {
					publickey : base64.encode(req.body.publickey)
				}

				knex('users').insert({username: req.body.username, password: hash, salt: salt, privatekey: req.body.privatekey, publickey: req.body.publickey})
				.then(function(rows){
					log.info({ method: 'POST', path: '/api/user', payload: req.body.username, message: 'Created new user' });
					res.send(200, 'OK');
					return next();
				})
				.catch(function(error){
					// SQLite Username Exists error
					if( error.errno == 19 && error.code === 'SQLITE_CONSTRAINT' ){
						res.send(400, "Username already exists.");
						return next();
					}
					log.error({ method: 'POST', path: '/api/user', payload: req.body.username, message: 'Undefined DB error', error: error });
					res.send(500, "Unknown database error.");
					return next();
				});
			});
		});
	});

	server.put('/api/user/:id', function(req, res, next){
		log.info({ method: 'PUT', path: '/api/user/'+req.params.id, payload: req.user });

		/*
			Contents:
			-----------
			username
			password
			publickey
			privatekey
		*/

		// Validate input
		if( !validate.id(req.params.id) ){
			log.debug({ method: 'PUT', path: '/api/user/'+req.params.id, payload: req.body, message: 'Invalid ID'});
			return next(new restify.errors.BadRequestError('Error: Invalid ID'));
		}

		if( !validate.json(req.body) ){
			log.debug({ method: 'PUT', path: '/api/user/'+req.params.id, payload: req.body, message: 'Invalid format of request'});
			return next(new restify.errors.BadRequestError('Error: Invalid format of request'));
		}

		if( username !== undefined && !validate.username(req.body.username) ){
			log.debug({ method: 'PUT', path: '/api/user/'+req.params.id, payload: req.body.username, message: 'Invalid username'});
			return next(new restify.errors.BadRequestError("Incomplete request: Invalid username"));
		}

		if( password !== undefined && !validate.password(req.body.password) ){
			log.debug({ method: 'PUT', path: '/api/user/'+req.params.id, payload: req.body.username, message: 'Invalid password'});
			return next(new restify.errors.BadRequestError("Incomplete request: Invalid password"));
		}

		if( privatekey !== undefined && !validate.privatekey(req.body.privatekey) ){
			log.debug({ method: 'PUT', path: '/api/user/'+req.params.id, payload: req.body.username, message: 'Invalid private key'});
			return next(new restify.errors.BadRequestError("Incomplete request: Invalid private key"));
		}

		if( publickey !== undefined && !validate.publickey(req.body.publickey) ){
			log.debug({ method: 'PUT', path: '/api/user/'+req.params.id, payload: req.body.username, message: 'Invalid public key'});
			return next(new restify.errors.BadRequestError("Incomplete request: Invalid public key"));
		}


		knex('users').where('id', req.user).update(req.body)
		.then(function(rows){
			if( rows < 1 ){
				log.debug({ method: 'PUT', path: '/api/user', payload: req.body, message: 'User ID not found' });
				return next( new restify.errors.NotFoundError('User ID not found') );
			}

			if( rows > 1 ){
				log.error({ method: 'PUT', path: '/api/user', payload: req.body, message: 'Multiple users found with same ID.' });
				return next( new restify.errors.InternalServerError('Catastropic internal database error') );
			}

			res.send(200, 'OK');
			return next();

		})
		.catch(function(err){
			log.debug({ method: 'PUT', path: '/api/user', payload: req.body, message: 'Database error', error: err });
			return next( new restify.errors.InternalServerError('Undefined database error') );

		})
	});

	server.del('/api/user/:id', function(req, res, next){

		var id = parseInt(req.params.id);

 		log.info({ method: 'DEL', path: '/api/user/'+req.params.id });

 		if( !validate.ID(id) ){
			return next(new restify.errors.BadRequestError('Incomplete request: Invalid ID'));
		}

		knex('users').where('id', id).del()
		.then(function(rows){
			if( rows === 0 ){
				// No user was found to be deleted
				log.debug({ method: 'DEL', path: '/api/user', payload: req.params.id, message: 'Client supplied non-existant username' });
				return next(new restify.errors.BadRequestError('User ID not found'));
			}
			log.info({ method: 'DEL', path: '/api/user', payload: req.params.id, message: 'User deleted', rowsAffected: rows });
			res.send(200, 'OK');
			return next();
		})
		.catch(function(err){
			console.log(err);
			console.log("%j", err);
			log.error({ method: 'DEL', path: '/api/user', payload: req.body, message: 'Database error', error: err });
			return next( new restify.errors.InternalServerError('LALA LAND') );
		});


	});

	server.get('/api/user/:id', function(req, res, next){
		log.info({method:'GET', path: '/api/users', payload: req.params.id});
		console.log('GET /api/user/'+req.params.id);

		knex.select('username', 'publickey').from('users').where('id', req.params.id)
		.then(function(rows){
			if(rows.length == 0){
				
				log.info({method: 'GET', path: '/api/user', payload: req.params.id, message: 'User not found in database.'});
				return next( new restify.errors.NotFoundError('Username not found'));
			}

			if( rows.length > 1 ){
				log.error({method: 'GET', path: '/api/user', payload: req.params.id, message: 'Found several users with same ID. Catastrophic error.'});
				return next( new restify.errors.InternalServerError('Catastropic internal server error.'));
			}

			res.send(200, rows[0]);
			return next();
		});
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