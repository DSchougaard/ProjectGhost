"use strict";

const Promise 		= require('bluebird');
const assert 		= require('assert');
const bcrypt 		= require('bcrypt');
const moment 		= require('moment');
const uuid 			= require('uuid');

const base64 		= require(__base + 'helpers/base64.js');
const knex 			= require(__base + 'database.js');
const resolve 		= require(__base + 'middlewares/resolve.js');


describe('Resolve', function(){

	var testUser, testPassword, testCategory, testInvite;

	before(function(){

		testInvite = {
			expires: moment().add('24', 'hours').unix(),
			link: uuid.v4(),
			used: false
		}

		testUser = {
			username: 'ResolveMiddlewareNormalUser',
			isAdmin: false,
			privatekey: base64.encode('privatekey'),
			publickey: base64.encode('publickey'),
			pk_salt 	: "Gvfqk3Dp/ezVweCxJ1BZgDADKWHDQGhy7tyEU5p+p3kZ9N8eWcPTEfLXqplZA5WVqMbLB3slU47jPXnj4krRDywT6CnK096wWP7Mc3khwlaRFLyjnf0u3TD9hs0udc194JwYXq0fAuzvM36iKlpXeGFDBVtP4NZV/7OIJX1LBkI=",
			iv 			: base64.encode('111111111'),
			two_factor_enabled: 0,
			two_factor_secret: null
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
				note: 'Note',
				url: 'google.com'
			};

			return knex('passwords')
			.insert(testPassword);
			
		})
		.then(function(id){
			testPassword.id = id[0];

			testCategory = {
				title  		: 'ResolveMiddleware#Category#Title',
				owner 		: testUser.id,
				parent 		: null
			};

			return knex('categories')
			.insert(testCategory);
		})
		.then(function(id){
			testCategory.id = id[0];

			return knex('invites')
			.insert(testInvite);
		})
		.then(function(id){
			testInvite.id = id[0];
		});
	});


	it('resolves a single user id', function(done){
		var req = {
			resolved:{
				user: 1	
			},
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
			resolved:{
				user: 1	
			},
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
	
	it('resolves a user id and a category id', function(done){
		var req = {
			resolved:{
				user: 1	
			},
			params:{
				userId : testUser.id,
				categoryId: testCategory.id
			}
		};

		resolve(req, null, function(err){
			assert.deepEqual(req.resolved.params.user, testUser);
			assert.deepEqual(req.resolved.params.category, testCategory);

			done();
		});
	});

	it('resolves a invite id', function(done){
		var req = {
			resolved:{
				user: 1	
			},
			params:{
				inviteId : testInvite.link
			}
		};

		resolve(req, null, function(err){
			assert.equal(req.resolved.params.invite.id, 			testInvite.id);
			assert.equal(req.resolved.params.invite.used, 			testInvite.used);
			assert.equal(req.resolved.params.invite.link, 			testInvite.link);
			assert.equal(req.resolved.params.invite.expires.unix(), testInvite.expires);

			done();
		});
	});

	it('throws an error when resolving a non-existing user id', function(done){
		var req = {
			resolved:{
				user: 1	
			},
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

	it('throws an error when resolving a non-existant password id', function(done){
		var req = {
			resolved:{
				user: 1	
			},
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

	it('throws an error when resolving a non-existant category id', function(done){
		var req = {
			resolved:{
				user: 1	
			},
			params:{
				categoryId : 1337
			}
		};

		resolve(req, null, function(err){

			assert.equal(err.message, 'Category was not found');
			assert.equal(err.statusCode, 404);

			assert.equal(err.body.code, 'NotFoundError');
			assert.equal(err.body.message, 'Category was not found');

			done();
		});	
	});

	it('throws an error when resolving a non-existant invite id', function(done){
		var req = {
			resolved:{
				user: 1	
			},
			params:{
				inviteId : 'de305d54-75b4-431b-adb2-eb6b9e546014'
			}
		};

		resolve(req, null, function(err){

			assert.equal(err.message, 'Invite was not found');
			assert.equal(err.statusCode, 404);

			assert.equal(err.body.code, 'NotFoundError');
			assert.equal(err.body.message, 'Invite was not found');

			done();
		});	
	});

	it('ignores any non-existing classnames', function(done){
		var req = {
			resolved:{
				user: 1	
			},
			params:{
				thisisnotaclassId : 1
			}
		};

		resolve(req, null, function(err){
			assert.equal(err, undefined);
			assert.equal(req.resolved.params, undefined);
			done();
		});
	});

	it('ignores when, except for two invalid last letters, it matches a class', function(done){
		var req = {
			resolved:{
				user: 1	
			},
			params:{
				userLA : 1
			}
		};

		resolve(req, null, function(err){
			assert.equal(err, undefined);
			assert.equal(req.resolved.params, undefined);
			done();
		});
	});

	after(function(){
		return knex('passwords')
		.where('id', testPassword.id)
		.del()
		.then(function(rows){

			return knex('categories')
			.where('id', testCategory.id)
			.del()
			.then(function(rows){

				return knex('users')
				.where('id', testUser.id)
				.del()
				.then(function(rows){

				});
			});
		});
	});
});