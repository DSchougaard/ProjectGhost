const restify 			= require('restify');
const _ 				= require('underscore');

// Models
var Invite  		= require(__base + 'models/invite.js');

// Middleware
const authentication 	= require(__base + 'middlewares/authentication.js');
const authorization  	= require(__base + 'middlewares/authorization.js');
const resolve 			= require(__base + 'middlewares/resolve.js');

// Errors
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const InviteDoesNotExistError 	= require(__base + 'errors/InviteDoesNotExistError.js');
const InvalidInviteError 		= require(__base + 'errors/InvalidInviteError.js');
const OperationalError 			= Promise.OperationalError;



module.exports = function(server, log){
	server.post('/api/invite', authentication, resolve, authorization, function(req, res, next){
		Invite.create()
		.then(function(invite){
			res.send(200, invite.link);
			return next();
		})
	});


}