'use strict'
const restify 					= require('restify');
		
// Models
const Audit 					= require(__base + '/models/audit.js');

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

	
module.exports = function(server){

	server.get('/api/users/:userId/audit', authentication, resolve, testauthorization({object: 'audit', method:'get'}), function(req, res, next){

		Audit.get(req.resolved.params.user)
		.then(function(rows){
			res.send(200, rows);
			return next();
		})
		.catch(SqlError, function(err){
			return next( new restify.errors.InternalServerError(err) );
		});

	});

};