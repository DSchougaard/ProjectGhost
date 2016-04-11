const restify 					= require('restify');
const _ 						= require('underscore');
const get_ip					= require('ipware')().get_ip;

// Models
var Invite  					= require(__base + 'models/invite.js');
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



module.exports = function(server, log){
	server.post('/api/invites', authentication, resolve, testauthorization({object: 'invite', method:'create'}), function(req, res, next){
		Invite.create()
		.then(function(invite){
			res.send(200, invite.link);
			Audit.report(req.resolved.user, get_ip(req).clientIp, 'Invite', invite.id, 'CREATE');

			return next();
		});
	});

	server.get('/api/invites/:inviteId', resolve, function(req, res, next){
		if( (req.resolved.params.invite).status().expired ){
			return next( new restify.errors.GoneError( 'Invite is expired' ) );
		}
		
		if( (req.resolved.params.invite).status().used ){
			return next( new restify.errors.GoneError( 'Invite already used' ) );
		}

		res.send(200, 'OK');
		return next();


		

	});

	server.post('/api/invites/:inviteId/accept', resolve, function(req, res, next){

		//Invite.find(req.params.inviteId)
		//.then(function(invite){
		//	return invite.use(req.body);
		//})

		//console.dir(req.params.resolved.invite);
		(req.resolved.params.invite).use(req.body)
		.then(function(user){
			res.send(200, {message: 'OK', id: user.id});

			Audit.report(user, get_ip(req).clientIp, 'Invite', req.resolved.params.invite.id, 'DELETE');
			Audit.report(user, get_ip(req).clientIp, 'User', user.id, 'CREATE');

			return next();
		})
		.catch(AlreadyExistError, function(err){
			return next( new restify.errors.BadRequestError(err.message) ) ;
		})
		.catch(SqlError, function(err){
			return next( new restify.errors.InternalServerError(err.message) );
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(InvalidInviteError, function(err){
			return next( new restify.errors.GoneError(err.message) );
		})
		.catch(InviteDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError('Invite was not found') );
		});
	});	
}