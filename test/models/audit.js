"use strict";

var Promise 						= require('bluebird');
var assert 							= require('assert');

const fs 							= require('fs');
const base64 						= require(__base + 'helpers/base64.js');
const _ 							= require('underscore');

// Models
var Invite  		= require(__base + 'models/invite.js');
var User 	 		= require(__base + 'models/user.js');
var SharedPassword 	= require(__base + 'models/sharedPassword.js');
var Password 		= require(__base + 'models/password.js')
var Audit 			= require(__base + 'models/audit.js');

// Errors
const PasswordDoesNotExistError 	= require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 				= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError 		= require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 						= require(__base + 'errors/SqlError.js');
const ConflictError 				= require(__base + 'errors/ConflictError.js');
const AlreadyExistError 			= require(__base + 'errors/Internal/AlreadyExistError.js');

// Database injection
var knex 							= require(__base + 'database.js');

describe.only('Audit', function(){

	describe('#report', function(){

		var user = {
			username: 'Audit#Report#User01',
			isAdmin: false,
			salt: 'cGFzc3dvcmQ=',
			password: 'cGFzc3dvcmQ=',
			privatekey: 'cGFzc3dvcmQ=',
			iv: 'cGFzc3dvcmQ=',
			pk_salt: 'cGFzc3dvcmQ=',
			publickey: 'cGFzc3dvcmQ='
		}

		var password = {
			parent 		: null,
			owner 		: null,
			title 		: 'Audit#Report-Title001',
			username 	: 'Audit#Report-User001',
			password 	: 'cGFzc3dvcmQ=',
			note 		: 'This is clearly a note!',
			url 		: null
		}

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
				password.owner = user.id;
			});
		});

		before(function(){
			return knex('passwords')
			.insert(password)
			.then(function(ids){
				password.id = ids[0];
			})
		})




		it('creates a report in the DB', function(){
			return Promise.all([User.find(user.id), Password.find(password.id)])
			.spread(function(user, password){
				return Audit.report(user, 'localhost', 'password', password.id, 'READ')
			})
			.then(function(audit){
				return knex('audit')
				.select()
				.where('userId', user.id);
			})
			.then(function(rows){
				assert.equal(rows.length, 1);

				assert.equal(rows[0].userId, user.id);
				assert.equal(rows[0].targetType, 'password');
				assert.equal(rows[0].action, 1);
				assert.equal(rows[0].host, 'localhost');

			})
			
		})

		it('should fail when passed an invalid user object', function(){
			var user = new User({
				username: 'Audit#Report#User01',
				isAdmin: false,
			});

			return Audit.report(user, 'localhost', 'Password Collecton', undefined, 'READ')
			.then(function(){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.name, 'ValidationError');
				assert.equal(err.message, '8 errors: data.id is required. data.salt is required. data.password is required. data.publickey is required. data.privatekey is required. data.iv is required. data.pk_salt is required. data.two_factor_enabled is required.');
			})
		});

	});


	describe('#get', function(){

		var users = [
			{
				username: 'Audit#Get#User01',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			},
			{
				username: 'Audit#Get#User02',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			}
		];

		var password = {
			parent 		: null,
			owner 		: null,
			title 		: 'Audit#Get-Title001',
			username 	: 'Audit#Get-User001',
			password 	: 'cGFzc3dvcmQ=',
			note 		: 'This is clearly a note!',
			url 		: null
		}

		before(function(){
			return knex('users')
			.insert(users[0])
			.then(function(ids){
				users[0].id = ids[0];
				password.owner = users[0].id;
			});
		});
		before(function(){
			return knex('users')
			.insert(users[1])
			.then(function(ids){
				users[1].id = ids[0];
				password.owner = users[1].id;
			});
		});


		before(function(){
			return knex('passwords')
			.insert(password)
			.then(function(ids){
				password.id = ids[0];
			})
		})

		before(function(){
			return Promise.all([User.find(users[0].id), Password.find(password.id)])
			.spread(function(user, password){

				var promises = [];
				promises.push( Audit.report(user, 'localhost', 'password', password.id, 'UPDATE') );
				promises.push( Audit.report(user, 'localhost', 'password', password.id, 'READ') );
				promises.push( Audit.report(user, 'localhost', 'password', password.id, 'DELETE') );

				return Promise.all(promises);
			})
			.then();
		})



		it('gets the audit list for a user', function(){
			return User.find(users[0].id)
			.then(function(user){
				return Audit.get(user);
			})
			.then(function(audit){
				assert.equal(audit.length, 3);

				// Index 0
				assert.equal(audit[0].userId, users[0].id);
				assert.equal(audit[0].host, 'localhost');
				assert.equal(audit[0].action, 'UPDATE');
				assert.equal(audit[0].targetType, 'password');
				assert.equal(audit[0].targetId, password.id);

				// Index 0
				assert.equal(audit[1].userId, users[0].id);
				assert.equal(audit[1].host, 'localhost');
				assert.equal(audit[1].action, 'READ');
				assert.equal(audit[0].targetType, 'password');
				assert.equal(audit[0].targetId, password.id);
				
				// Index 0
				assert.equal(audit[2].userId, users[0].id);
				assert.equal(audit[2].host, 'localhost');
				assert.equal(audit[2].action, 'DELETE');
				assert.equal(audit[0].targetType, 'password');
				assert.equal(audit[0].targetId, password.id);
			})
		});

		it('returns an empty list when a user has no audit entries', function(){
			return User.find(users[1].id)
			.then(function(user){
				return Audit.get(user);
			})
			.then(function(audit){
				assert.equal(audit.length, 0);
			})

		});

	});

});
