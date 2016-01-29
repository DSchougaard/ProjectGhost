const restify = require('restify');
const Promise = require('bluebird');
const _ 		= require('underscore');

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

	/*
		Input:
		req.params = {
			userId,
			passwordId,
			....
		}

		Output:
		req.resolved = {
			user: ...,
			params: {
				user: 1,
				password 1
			}
		}
	*/

	var targetUser 		= req.params.userId;
	var targetPassword 	= req.params.passwordId;

	var objects = [];
	var objectTypes = [];

	if(req.user === undefined )
		return next( new restify.errors.InternalServerError('Authentication and authorization mismatch'));

	var test = {
		user: User,
		password: Password
	};

	_.mapObject(req.params, function(val, key){
		objectTypes.push(key.slice(0, -2));
		objects.push( (test[key.slice(0, -2)]).find(val) );
	});

	req.resolved = req.resolved || {};
	req.resolved.params = {};

	Promise.all(objects)
	.then(function(objs){

		for( var i = 0 ; i < objs.length ; i++ ){
			req.resolved.params[ objectTypes[i] ] = objs[i];
		}

		next();
	})
	.catch(UserDoesNotExistError, function(err){
		return next(new restify.errors.NotFoundError('User was not found'));
	})
	.catch(PasswordDoesNotExistError, function(err){
		return next(new restify.errors.NotFoundError('Password was not found'));
	})
	.catch(SqlError, function(err){
		req.log.error({source: 'resolve middleware', error: err, message: 'Sql Error' });
		return next( new restify.errors.InternalServerError('Internal database error') );
	});
};
