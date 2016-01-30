const restify = require('restify');
const Promise = require('bluebird');

// Errors
const UnauthorizedError 	= require(__base + 'errors/UnauthorizedError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');

const SqlError 				= require(__base + 'errors/SqlError.js');

// Models
var User = require(__base + 'models/user.js')
var Password = require(__base + 'models/password.js')

module.exports = function(req, res, next){
	var targetUser = req.params.userId;
	var targetPassword = req.params.passwordId;


	// Identify what is requested access to
	if( targetPassword !== undefined ){

		Promise.all([User.find(targetUser), Password.find(targetPassword)])
		.spread(function(user, password){
			if( password.owner === user.id && user.id === req.resolved.user.id ){
				return next();	
			}else{
				return next(new restify.errors.ForbiddenError('Insufficient privileges'));
			}
		})
		// Well this is a dirty, dirty hack....
		.catch(UserDoesNotExistError, function(){
			return next();
		})
		.catch(PasswordDoesNotExistError, function(){
			return next();
		}).catch(ValidationError, function(){
			return next();
		});

	}else{
		User.find(targetUser)
		.then(function(user){
			if( req.resolved.user.id === user.id || req.resolved.user.isAdmin ){
				return next();
			}else{
				return next(new restify.errors.ForbiddenError('Insufficient privileges'));
			}

		})
	}
 }