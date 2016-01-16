const restify 			= require('restify');
const knex 				= require('knex');

const authHelpers 		= require(__base + 'helpers/authHelpers.js');
const constants 		= require(__base + 'helpers/constants.json');


module.exports = function(server, knex, log){
	server.post('/api/password', authHelpers.ensureAuthenticated, function(req, res, next){
		log.info({ method: 'POST', path: '/api/password', payload: req.body });
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

		var password = {
			title 		: req.body.title,
			username 	: req.body.username,
			iv 			: req.body.iv,
			password 	: req.body.password,

			// Insert request's user ID into the password
			owner 		: req.user,

			// Cover for the optional values
			parent 		: typeof req.body.parent !== undefined ? req.body.parent 	: null,
			note 		: typeof req.body.note 	 !== undefined ? req.body.note 		: null
		}

		// Insert into DB
		knex('passwords').insert(password)
		.then(function(rows){
			log.info({ method: 'POST', path: '/api/password', payload: req.body, message: 'Password added' });
			res.send(200, 'OK');
			return next();
		})
		.catch(function(err){
			if( err.code === 19 ){
				// SQLite Constraint Violation
				log.debug({ method: 'POST', path: '/api/password', payload: req.body, message: 'Parent category does not exist'});
				return (new restify.errors.BadRequestError("Parent category does not exist"));
			}


			console.log("POST /api/password DB error: " + err);
			//console.log("POST /api/password DB error: " + JSON.stringify(err, null, 4));
			return next(new restify.errors.InternalServerError('Internal database error'));
		});
	});



	server.get('/api/passwords/', authHelpers.ensureAuthenticated, function(req, res, next){
		log.info({ method: 'GET', path: '/api/passwords', payload: req.user });

		knex.select('id', 'parent', 'title', 'username', 'note' ).from('passwords').where('owner', req.user)
		.then(function(rows){
			res.send(200, rows);
		})
		.catch(function(err){

		});
	
	});

	
	server.del('/api/password', authHelpers.ensureAuthenticated, function(req, res, next){
		return next(new restify.errors.NotImplementedYet('API endpoint not implemented yet'));
	});

	server.put('/api/password', authHelpers.ensureAuthenticated, function(req, res, next){
		return next(new restify.errors.NotImplementedYet('API endpoint not implemented yet'));
	});

}