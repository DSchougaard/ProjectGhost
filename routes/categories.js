const restify 			= require('restify');
const Promise 			= require('bluebird');
const _ 				= require('underscore');
const schemagic 		= require('schemagic');
const get_ip			= require('ipware')().get_ip;

// Models
const Password 			= require(__base + 'models/password.js');
const User 				= require(__base + 'models/user.js');
const Category 			= require(__base + 'models/category.js');
const Audit				= require(__base + 'models/audit.js');

// Errors
const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const ValidationRestError 		= require(__base + 'errors/ValidationRestError.js');
const CategoryDoesNotExistError = require(__base + 'errors/CategoryDoesNotExistError.js');
const UnauthorizedError 		= require(__base + 'errors/UnauthorizedError.js');

// Middleware
const authentication 	= require(__base + 'middlewares/authentication.js');
const authorization  	= require(__base + 'middlewares/authorization.js');
const resolve 			= require(__base + 'middlewares/resolve.js');


module.exports = function(server, log){

	server.post('/api/users/:userId/categories', authentication, resolve, authorization, function(req, res, next){

		var category 	= _.clone(req.body);
		category.owner 	= req.resolved.user.id;
		category 		= _.defaults(category, {parent: null});

		Category.create(category)
		.then(function(category){
			res.send(200, category.id);
			Audit.report(req.resolved.user, get_ip(req).clientIp, 'Category', category.id, 'CREATE');

			return next();
		})
		.catch(UnauthorizedError, function(err){
			return next( new restify.errors.BadRequestError(err.cause) );
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(CategoryDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError('Parent category not found') );
		})
		.catch(SqlError, function(err){
			//if(err.message === 'Category already exists')
			return next( new restify.errors.InternalServerError(err.message) );
		})
		.catch(function(err){
			console.log(err);
		});
	});

	server.del('/api/users/:userId/categories/:categoryId', authentication, resolve, authorization, function(req, res, next){
		
		(req.resolved.params.category).del()
		.then(function(rows){
			res.send(200, 'OK');
			Audit.report(req.resolved.user, get_ip(req).clientIp, 'Category', req.resolved.params.category.id, 'DELETE');

			return next();
		})
		.catch(CategoryDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError(err) );
		})
		.catch(SqlError, function(err){
			if( err.message === 'Category had attached children'){
				return next( new restify.errors.ConflictError(err.message) );
			}else{
				return next( new restify.errors.InternalServerError(err.message) );
			}
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(function(e){
			return next(e);
		});

	});

	server.put('/api/users/:userId/categories/:categoryId', authentication, resolve, authorization,  function(req, res, next){
		(req.resolved.params.category).update(req.body)
		.then(function(){
			res.send(200, 'OK');
			Audit.report(req.resolved.user, get_ip(req).clientIp, 'Category', req.resolved.params.category.id, 'DELETE');

			return next();
		})
		.catch(ValidationError, function(err){
			return next( new ValidationRestError('Validation error', err.errors));
		})
		.catch(CategoryDoesNotExistError, function(err){
			return next( new restify.errors.NotFoundError('Category was not found') );
		})
		.catch(SqlError, function(err){
			console.log(err);
			return next( new restify.errors.InternalServerError(err) );
		});

	});

	server.get('/api/users/:userId/categories', authentication, resolve, authorization, function(req, res, next){
		//res.setHeader('Allowed', 'POST, DEL, PUT');
		Category.findAll(req.resolved.user)
		.then(function(categories){
			res.send(200, categories);
			Audit.report(req.resolved.user, get_ip(req).clientIp, 'Category Collection', undefined, 'DELETE');
			
			return next();
		});
	});

	server.get('/api/users/:userId/categories/:categoryId', function(req, res, next){
		res.setHeader('Allowed', 'POST, DEL, PUT');
		return next(new restify.errors.MethodNotAllowedError());
	});
}