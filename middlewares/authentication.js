const fs 				= require('fs');
const moment 			= require('moment');
const jwt 				= require('jsonwebtoken');
const restify 			= require('restify');
const Promise 			= require('bluebird');
const verifyPromise 	= Promise.promisify(jwt.verify);

// Private and Public Key for Signing JWTs
const privateKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.key');
const publicKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.crt');

// Models
const User 				= require(__base + 'models/user.js');

// Errors
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError = require(__base + 'errors/ValidationError');

const ValidationRestError = require(__base + 'errors/ValidationRestError.js');

module.exports = function(req, res, next) {
	if (!req.headers.authorization) {
		return next(new restify.errors.UnauthorizedError('No Authorization header was found'));
	}
	// Extract token from the request headers
	var token = req.headers.authorization.split(' ')[1];


	verifyPromise(token, publicKey)
	.then(function(decoded){
		return User.find(decoded.uid);
	})
	.then(function(resolvedUser){
		req.resolved = {
			user: resolvedUser
		};
		return next();
	})
	.catch(ValidationError, function(err){
		console.log("Unexpected validation error");
		return next( new restify.errors.BadRequestError('') );
	})
	.catch(UserDoesNotExistError, function(err){
		//res.send(400, 'User ID ' +  + ' was not found');
		console.log("User was not found");
		return next( new restify.errors.BadRequestError('User was not found') );
	})
	.catch(function(err){
		// Cue Error Handling
		if( err.name === 'JsonWebTokenError' ){
			// Invalid Signature
			return next(new restify.errors.UnauthorizedError('Invalid auth token'));
		}else if( err.name === 'TokenExpiredError' ){
			// The token was expired
			return next(new restify.errors.UnauthorizedError('Token has expired'));	
		}else{
			console.log('Undefined error in verifying JWT:' + err);
			throw err;
		}
	});
};