"use strict";

var Promise = require('bluebird');

var assert = require('assert');

const fs 		= require('fs');
const base64 	= require(__base + 'helpers/base64.js');
const _ 		= require('underscore');
const bcrypt 	= require('bcrypt');

const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');

const unittestData = require(__base + 'misc/unitTestData.js');

var User 			= require(__base + 'models/user.js');

var knex = require(__base + 'database.js');

describe('Authorization', function(){

	var normalUser = {
		username: 'AuthorizationMiddlewareNormalUser',
		isAdmin: false,
		privatekey: base64.encode('privatekey'),
		publickey: base64.encode('publickey')
	};
	var adminUser = {
		username: 'AuthorizationMiddlewareAdminUser',
		isAdmin: true,
		privatekey: base64.encode('privatekey'),
		publickey: base64.encode('publickey')
	};


	before(function(done){
		normalUser.salt =  bcrypt.genSaltSync();
		normalUser.password =  bcrypt.hashSync('password', normalUser.salt);
		adminUser.salt =  bcrypt.genSaltSync();
		adminUser.password =  bcrypt.hashSync('password', adminUser.salt);
		return done();
	});

	before(function(){
		return knex('users')
		.insert(normalUser)
		.then(function(ids){
			normalUser.id = ids[0];
		});
	});

	before(function(){
		return knex('users')
		.insert(adminUser)
		.then(function(ids){
			adminUser.id = ids[0];
		});
	});

	var normalUserPassword = '';
	var adminUserPassword = '';

	before(function(done){
		normalUserPassword  = {
			owner : normalUser.id,
			parent : null,
			title : 'AuthorizationMiddlewareNormalUserPasswordTitel',
			username: 'AuthorizationMiddlewareNormalUserPasswordUsername',
			password  : base64.encode('AuthorizationMiddlewareNormalUserPasswordPassword'),
			iv : base64.encode('1111111111111111'),
			note: 'Note'
		};
		adminUserPassword = {
			owner : adminUser.id,
			parent : null,
			title : 'AuthorizationMiddlewareAdminUserPasswordTitel',
			username: 'AuthorizationMiddlewareAdminUserPasswordUsername',
			password  : base64.encode('AuthorizationMiddlewareAdminUserPasswordPassword'),
			iv : base64.encode('1111111111111111'),
			note: 'Note'
		};
		return done();
	});


	before(function(){
		return knex('passwords')
		.insert(normalUserPassword)
		.then(function(id){
			normalUserPassword.id = id[0];
		});
	});
	
	before(function(){
		return knex('passwords')
		.insert(adminUserPassword)
		.then(function(id){
			adminUserPassword.id = id[0];
		});
	});



	var authorization = require(__base + 'middlewares/authorization.js');

	describe('User -> User', function(){
		it('user should not be allowed access admin\'s user info', function(done){
			var req = {};
			req.resolved = {};
			req.resolved.user = new User(normalUser);
			req.params = {};
			req.params.userId = adminUser.id;

			authorization(req, null, function(res){

				assert.equal(res.message, 'Insufficient privileges');
				assert.equal(res.statusCode, 403);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});

		it('user should be allowed access to his own user info', function(done){
			var req = {};
			req.resolved = {};
			req.resolved.user = new User(normalUser);
			req.params = {};
			req.params.userId = normalUser.id;

			authorization(req, null, function(res){
				assert.equal(res, undefined);
				return done();
			});
		});
		
		it('admin should be allowed access to his own user info', function(done){
			var req = {};
			req.resolved = {};
			req.resolved.user = new User(adminUser);
			req.params = {};
			req.params.userId = adminUser.id;

			authorization(req, null, function(res){
				assert.equal(res, undefined);
				return done();
			});
		});
	});

	describe('User -> Password', function(){
		it('should allow user access to own password', function(done){
			var req = {};
			req.resolved = {};
			req.resolved.user = new User(normalUser);
			req.params = {};
			req.params.userId = normalUser.id;
			req.params.passwordId = normalUserPassword.id;

			authorization(req, null, function(res){
				assert.equal(res, undefined);
				return done();
			});
		});	

		it('should allow admin access to own password', function(done){
			var req = {};
			req.resolved = {};
			req.resolved.user = new User(adminUser);
			req.params = {};
			req.params.userId = adminUser.id;
			req.params.passwordId = adminUserPassword.id;

			authorization(req, null, function(res){
				assert.equal(res, undefined);
				return done();
			});
		});

		it('should not allow admin access to other user\'s password', function(done){
			var req = {};
			req.resolved = {};
			req.resolved.user = new User(adminUser);
			req.params = {};
			req.params.userId = normalUser.id;
			req.params.passwordId = normalUserPassword.id;

			authorization(req, null, function(res){
				assert.equal(res.message, 'Insufficient privileges');
				assert.equal(res.statusCode, 403);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');
				return done();
			});
		});

		it('should not allow user access to other user\'s password', function(done){
			var req = {};
			req.resolved = {};
			req.resolved.user = new User(normalUser);
			req.params = {};
			req.params.userId = adminUser.id;
			req.params.passwordId = adminUserPassword.id;

			authorization(req, null, function(res){
				assert.equal(res.message, 'Insufficient privileges');
				assert.equal(res.statusCode, 403);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');
				return done();
			});
		});

		it('should fail when userid and password id does not match up', function(done){
			var req = {};
			req.resolved = {};
			req.resolved.user = new User(normalUser);
			req.params = {};
			req.params.userId = normalUser.id;
			req.params.passwordId = adminUserPassword.id;

			authorization(req, null, function(res){
				assert.equal(res.message, 'Insufficient privileges');
				assert.equal(res.statusCode, 403);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');
				return done();
			});

		});
	});

	after(function(){
		return knex('passwords')
		.where('id', normalUserPassword.id)
		.orWhere('id', adminUserPassword.id)
		.del()
		.then(function(rows){
			if( rows !== 2 )
				console.log("Middlewares/Authorization Password entries not removed completely.");
		});
	});

	after(function(){
		return knex('users')
		.where('id', normalUser.id)
		.orWhere('id', adminUser.id)
		.del()
		.then(function(rows){
			if( rows !== 2 )
				console.log("Middlewares/Authorization User entries not removed completely.");
		});
	});


});