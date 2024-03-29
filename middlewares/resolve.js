// Libraries
const restify 					= require('restify');
const Promise 					= require('bluebird');
const _ 						= require('underscore');

// Errors
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const CategoryDoesNotExistError = require(__base + 'errors/CategoryDoesNotExistError.js');
const InviteDoesNotExistError  	= require(__base + 'errors/InviteDoesNotExistError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const ValidationRestError 		= require(__base + 'errors/ValidationRestError.js');

// Models
var User 						= require(__base + 'models/user.js')
var Password 					= require(__base + 'models/password.js')
var Category 					= require(__base + 'models/category.js')
var Invite  					= require(__base + 'models/invite.js')
var SharedPassword 				= require(__base + 'models/sharedPassword.js')


module.exports = function(req, res, next){

	/* 	Here we link a string -> object. 
		I know, it's static. But fuck, JS doens't have that 
		fancy ass shit like java... Wait....
	*/
	var classNames = {
		user: User,
		password: Password,
		category: Category,
		invite: Invite,
		share: SharedPassword
	};

	// Create empty arrays for storage of identifiers and promises
	var objects = [];
	var objectTypes = [];

	if( req.resolved === undefined ){
		req.resolved = {};
	}

	// Hell, if this is set it isnt an authenicated user and this middleware should NOT be called...
	//if(req.resolved.user === undefined ){
	//	console.log("REsolver");
	//	return next( new restify.errors.InternalServerError('Authentication and authorization mismatch'));
	//}

	/* 	All url parameters in restify, is localted in the req.params object.
	 	They're called exactly the same as in the URLs created...
	 	SO BE FUCKING CONSISTENT. A user's ID is ALWAYS userId, and so forth
	 */
	 // Loop over req.param's keys, and push to the two previously created arrays
	_.mapObject(req.params, function(val, key){
		// key.slice removes the "Id" part form the parameters, 
		// hence the previous naming convention... The keyword?
		// FUCKING CONSISTENCY

		// If the name is not present in classNames array, we're
		// dealing with a body parameter and should skip.
		if( key.slice(-2) === 'Id' && classNames[key.slice(0, -2)] !== undefined ){
			
			// Creating empty JSON object for the resolved objects to be placed in
			if( req.resolved.params === undefined ) 
				req.resolved.params = {};

			objectTypes.push(key.slice(0, -2));
			objects.push( (classNames[key.slice(0, -2)]).find(val) );
		}

	});


	// I promise it all.....
	Promise.all(objects)
	.then(function(objs){

		// Promise#All resolves in same order as input, so 
		// loop over all entries and insert them into 
		// req.resolved.params with the corrosponding key,
		// from the objectTypes array created earlier

		for( var i = 0 ; i < objs.length ; i++ ){
			req.resolved.params[ objectTypes[i] ] = objs[i];
		}

		next();
	})
	// Catch the errors that might pop up from the promises.
	.catch(UserDoesNotExistError, function(err){
		return next(new restify.errors.NotFoundError('User was not found'));
	})
	.catch(PasswordDoesNotExistError, function(err){
		return next(new restify.errors.NotFoundError('Password was not found'));
	})
	.catch(CategoryDoesNotExistError, function(err){
		return next(new restify.errors.NotFoundError('Category was not found'));
	})
	.catch(InviteDoesNotExistError, function(err){
		return next(new restify.errors.NotFoundError('Invite was not found'));
	})
	.catch(ValidationError, function(err){
		//return next( new restify.errors.BadRequestError('ValidationError: ' + err.errors[0].property + ' ' + err.errors[0].message) );

		return next( new ValidationRestError('Validation error', err.errors) );
		
	})
	.catch(SqlError, function(err){
		req.log.error({source: 'resolve middleware', error: err, message: 'Sql Error' });
		return next( new restify.errors.InternalServerError('Internal database error') );
	})
	.catch(function(err){
		return next( new restify.errors.InternalServerError(err) );
	});
};
