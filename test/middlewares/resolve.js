"use strict";

var Promise = require('bluebird');
var assert = require('assert');
var bcrypt = require('bcrypt');

var base64 = require(__base + 'helpers/base64.js');
var knex = require(__base + 'database.js');
var resolve = require(__base + 'middlewares/resolve.js');

describe.only('Resolve', function(){

	var testUser, testPassword;

	before(function(){

		testUser = {
			username: 'ResolveMiddlewareNormalUser',
			isAdmin: false,
			privatekey: base64.encode('privatekey'),
			publickey: base64.encode('publickey')
		};
		testUser.salt =  bcrypt.genSaltSync();
		testUser.password =  bcrypt.hashSync('password', testUser.salt);

		return knex('users')
		.insert(testUser)
		.then(function(id){
			testUser.id = id[0];
			
			testPassword  = {
				owner : testUser.id,
				parent : null,
				title : 'ResolveMiddlewareNormalUserPasswordTitle',
				username: 'ResolveMiddlewareNormalUserPasswordUsername',
				password  : base64.encode('ResolveMiddlewareNormalUserPasswordPassword'),
				iv : base64.encode('1111111111111111'),
				note: 'Note'
			};

			return knex('passwords')
			.insert(testPassword)
			.then(function(id){
				testPassword.id = id[0];
			});
		});
	});


	it('resolves a single user id', function(done){
		var req = {
			user: 1,
			params:{
				userId : testUser.id
			}
		};

		resolve(req, null, function(err){
			assert.deepEqual(req.resolved.params.user, testUser);
			done();
		});
	});

	it('resolves a user id and a password id', function(done){
		var req = {
			user: 1,
			params:{
				userId : testUser.id,
				passwordId: testPassword.id
			}
		};

		resolve(req, null, function(err){
			assert.deepEqual(req.resolved.params.user, testUser);
			assert.deepEqual(req.resolved.params.password, testPassword);

			done();
		});
	});
	
	it('throws an error when resolving a non-existing user id', function(done){
		var req = {
			user: 1,
			params:{
				userId : 1337
			}
		};

		resolve(req, null, function(err){

			assert.equal(err.message, 'User was not found');
			assert.equal(err.statusCode, 404);

			assert.equal(err.body.code, 'NotFoundError');
			assert.equal(err.body.message, 'User was not found');

			done();
		});	
	});

	it('throws an error when resolving a non-existant password id', function(){
		var req = {
			user: 1,
			params:{
				passwordId : 1337
			}
		};

		resolve(req, null, function(err){

			assert.equal(err.message, 'Password was not found');
			assert.equal(err.statusCode, 404);

			assert.equal(err.body.code, 'NotFoundError');
			assert.equal(err.body.message, 'Password was not found');

			done();
		});	
	});


});