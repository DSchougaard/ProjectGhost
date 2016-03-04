const restify = require('restify');
const Promise = require('bluebird');

// Errors
const UnauthorizedError 	= require(__base + 'errors/UnauthorizedError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const CategoryDoesNotExistError = require(__base + 'errors/CategoryDoesNotExistError.js');
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');

const SqlError 				= require(__base + 'errors/SqlError.js');

// Models
var User = require(__base + 'models/user.js')
var Password = require(__base + 'models/password.js')
var Category = require(__base + 'models/category.js')

module.exports = function(req, res, next){
	var targetUser  	= req.params.userId;
	var targetPassword 	= req.params.passwordId;
	var targetCategory 	= req.params.categoryId;

	// Identify what is requested access to
	if( targetCategory !== undefined ){
		Promise.all([User.find(targetUser), Category.find(targetCategory)])
		.spread(function(user, category){
			if( category.owner === user.id && user.id === req.resolved.user.id ){
				return next();	
			}else{
				return next(new restify.errors.ForbiddenError('Insufficient privileges'));
			}
		})
		// Well this is a dirty, dirty hack....
		.catch(UserDoesNotExistError, function(){
			return next();
		})
		.catch(CategoryDoesNotExistError, function(){
			return next();
		}).catch(ValidationError, function(){
			return next();
		});

	}else if( targetPassword !== undefined ){

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