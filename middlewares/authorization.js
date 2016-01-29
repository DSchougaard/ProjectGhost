const restify = require('restify');
const Promise = require('bluebird');

// Errors
const UnauthorizedError 	= require(__base + 'errors/UnauthorizedError.js');

const SqlError 				= require(__base + 'errors/SqlError.js');

// Models
var User = require(__base + 'models/user.js')
var Password = require(__base + 'models/password.js')

module.exports = function(req, res, next){
	var requestingUser = req.user;
	var targetUser = req.params.userId;
	var targetPassword = req.params.passwordId;

	
	// Identify what is requested access to
	if( targetPassword !== undefined ){

		Promise.all([User.find(requestingUser), User.find(targetUser), Password.find(targetPassword)])
		.spread(function(authed, user, password){
			if( password.owner === user.id && user.id === authed.id ){
				return next();	
			}else{
				return next(new restify.errors.UnauthorizedError('Insufficient privileges'));
			}
		});

	}else{
		Promise.all([User.find(requestingUser), User.find(targetUser)])
		.spread(function(authed, user){
			if( authed.id === user.id || authed.isAdmin ){
				return next();
			}else{
				return next(new restify.errors.UnauthorizedError('Insufficient privileges'));
			}
		});
	}
 }