const restify = require('restify');
const Promise = require('bluebird');
const _ 	  = require('underscore');


module.exports = function(permObject){

	/*
		object: Type of Object being authorized to acess
		target: Owner of the object, enum: {self, all}
		method: Type of action on object
	*/

	function deny(next){
		return next(new restify.errors.ForbiddenError('Insufficient privileges'));
	}

	function invite(permObject, req, res, next){
		// Supported Methods
		var methods = ['create'];

		// Check to see if method is supported in authorization suite
		if( _.indexOf(methods, permObject.method) === -1 ){
			return deny(next);
		}

		if( permObject.method === methods[0] ){
			// Allow creation of invite, if the user is an admin
			if( req.resolved.user.isAdmin ){
				return next();
			}

			return next(new restify.errors.ForbiddenError('Insufficient privileges'));

		}

	}

	function user(permObject, req, res, next){
		// Supported Methods
		var methods = ['create', 'get', 'get/me', 'update', 'delete'];
	
		// Check to see if method is supported in authorization suite
		if( _.indexOf(methods, permObject.method) === -1 ){
			return deny(next);
		}

		// Create
		if( permObject.method === methods[0] ){
			// Only admins can create
			if( req.resolved.user.isAdmin ){
				return next();
			}else{
				return deny(next);
			}
		// Get
		}else if( permObject.method === methods[1] ){
			if( req.resolved.user !== undefined ){
				return next();	
			}else{
				return deny(next);
			}

		// Get/me
		}else if( permObject.method === methods[2] ){
			if( req.resolved.user !== undefined ){
				return next();	
			}else{
				return deny(next);
			}

		// Update
		}else if( permObject.method === methods[3] ){
			if( req.resolved.user.id === req.resolved.params.user.id ){
				return next();
			}else{
				return deny(next);
			}
		// Delete
		}else if( permObject.method === methods[4] ){
			if( req.resolved.user.id === req.resolved.params.user.id || req.resolved.user.isAdmin ){
				return next();
			}else{
				return deny(next);
			}
		}

	}

	function password(permObject, req, res, next){

	}

	function category(permObject, req, res, next){

	}
	
	function audit(permObject, req, res, next){
		// Supported Methods
		var methods = ['get'];
		
		// Check to see if method is supported in authorization suite
		if( _.indexOf(methods, permObject.method) === -1 ){
			return deny(next);
		}

		// Get
		if( permObject.method === methods[0] ){

			// If logged in user differs from target user, and logged in user is NOT admin,
			// deny access
			if( req.resolved.user.id !== req.resolved.params.user.id && !req.resolved.user.isAdmin ){
				return deny(next);
			}

			return next();
		}


	}



	return function (req, res, next) {
		if( req.resolved.user === undefined ){
			console.warn('This was unexpected...');
		}

		switch(permObject.object) {
			case 'invite':
				return invite(permObject, req, res, next);
				break;
			case 'user':
				return user(permObject, req, res, next);
				break;
			case 'audit':
				return audit(permObject, req, res, next);
				break;
			case 'password':
				return next();
				break;
			case 'category':
				return next();
				break;
			default:
				console.warn('Unknown object for Authorization.');
				return deny();
		}



	};
}

/*

	User: 
	user.self.edit
	user.self.delete
	user.self.get

	password.self.edit
	password.self.delete
	password.self.create
	password.self.get
	
	category.self.edit
	category.self.delete
	category.self.create
	category.self.get

	Admin:
	user.all.create
	user.all.delete
	user.all.get

	invite.create




	None:
	password.all.edit
	password.all.delete
	password.all.create
	password.all.get

	
*/