/* global __base */

///<reference path="../../typings/assert/assert.d.ts" />

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

// Errors
const PasswordDoesNotExistError 	= require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 				= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError 		= require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 						= require(__base + 'errors/SqlError.js');

// Database injection
var knex 							= require(__base + 'database.js');

describe.only('SharedPassword', function(){

	describe('#findSharedFromMe', function(){
		var users = [
			{
				username: 'SharedPassword-FindSharedFromMe-User01',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			},
			{
				username: 'SharedPassword-FindSharedFromMe-User02',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			}
		];

		before(function(){
			return knex
			.insert(users[0])
			.into('users')
			.then(function(id){
				users[0].id = id[0];

				passwords[users[0].username][0].owner = id[0];
				passwords[users[0].username][1].owner = id[0];
				passwords[users[0].username][2].owner = id[0];

			});
		})

		before(function(){
			return knex
			.insert(users[1])
			.into('users')
			.then(function(id){
				users[1].id = id[0];

				passwords[users[1].username][0].owner = id[0];
				passwords[users[1].username][1].owner = id[0];
				passwords[users[1].username][2].owner = id[0];

			});
		})

		var passwords = {};
		passwords[users[0].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedFromMe-Title001',
				username 	: 'SharedPassword-FindSharedFromMe-User001',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedFromMe-Title002',
				username 	: 'SharedPassword-FindSharedFromMe-User002',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedFromMe-Title003',
				username 	: 'SharedPassword-FindSharedFromMe-User003',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		passwords[users[1].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedFromMe-Title011',
				username 	: 'SharedPassword-FindSharedFromMe-User011',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedFromMe-Title012',
				username 	: 'SharedPassword-FindSharedFromMe-User012',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedFromMe-Title013',
				username 	: 'SharedPassword-FindSharedFromMe-User013',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		// User[0] passwords
		before(function(){
			var password = passwords[users[0].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});

		// User[1] passwords
		before(function(){
			var password = passwords[users[1].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});

		var sharedPasswords = [
		]

		// Create shares from User[0] -> User[1]
		before(function(){
			return knex
			.insert({
				owner: users[1].id,
				origin_owner: users[0].id,
				parent: null,
				origin_password: passwords[users[0].username][0].id,
				password: 'c29tZW90aGVycGFzc3dvcmQ='
			})
			.into('shared_passwords')
			.then( );
		});
		before(function(){
			return knex
			.insert({
				owner: users[1].id,
				origin_owner: users[0].id,
				parent: null,
				origin_password: passwords[users[0].username][2].id,
				password: 'c29tZW90aGVycGFzc3dvcmQ='
			})
			.into('shared_passwords')
			.then( );
		});

		it('returns returns a list of passwords a user has shared with another user', function(){
			return User.find(users[0].id)
			.then(function(user){
				return SharedPassword.findSharedFromMe(user);

			})
			.then(function(sharedPasswords){
				assert.equal(sharedPasswords.length, 2);

				var _passwords = passwords[users[0].username]

				// SharedPassword[0]
				// Origin Values
				assert.equal(sharedPasswords[0].origin_owner, 	users[0].id)
				assert.equal(sharedPasswords[0].origin_password,_passwords[0].id);

				// Inherited from Origin
				//assert.equal(sharedPasswords[0].title, 			_passwords[0].title);
				//assert.equal(sharedPasswords[0].username,		_passwords[0].username);
				//assert.equal(sharedPasswords[0].url, 			_passwords[0].url);
				//assert.equal(sharedPasswords[0].note, 			_passwords[0].note);

				// User Shared To
				assert.equal(sharedPasswords[0].owner, 			users[1].id);
				assert.equal(sharedPasswords[0].parent,			null);
				assert.notEqual(sharedPasswords[0].password,	users[1].password);

				// SharedPassword[1]
				// Origin Values
				assert.equal(sharedPasswords[1].origin_owner, 	users[0].id)
				assert.equal(sharedPasswords[1].origin_password,_passwords[2].id);

				// Inherited from Origin
				//assert.equal(sharedPasswords[1].title, 			_passwords[0].title);
				//assert.equal(sharedPasswords[1].username,			_passwords[0].username);
				//assert.equal(sharedPasswords[1].url, 				_passwords[0].url);
				//assert.equal(sharedPasswords[1].note, 			_passwords[0].note);

				// User Shared To
				assert.equal(sharedPasswords[0].owner, 			users[1].id);
				assert.equal(sharedPasswords[0].parent,			null);
				assert.notEqual(sharedPasswords[0].password,	users[1].password);

				return;
			});
		});

		it('returns an empty list, when the user has not shared any passwords', function(){
			return User.find(users[1].id)
			.then(SharedPassword.findSharedFromMe)
			.then(function(sharedPasswords){
				assert.equal(sharedPasswords.length, 0);
			});
		});

		
		after(function(){
			return knex
			.del()
			.from('shared_passwords')
			.where('origin_owner', users[0].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('passwords')
			.where('owner', users[0].id)
			.orWhere('owner', users[1].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('users')
			.where('id', users[0].id)
			.orWhere('id', users[1].id)
			.then();
		});
	});

	describe('#findSharedToMe', function(){
		var users = [
			{
				username: 'SharedPassword-FindSharedToMe-User01',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			},
			{
				username: 'SharedPassword-FindSharedToMe-User02',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			}
		];

		before(function(){
			return knex
			.insert(users[0])
			.into('users')
			.then(function(id){
				users[0].id = id[0];

				passwords[users[0].username][0].owner = id[0];
				passwords[users[0].username][1].owner = id[0];
				passwords[users[0].username][2].owner = id[0];

			});
		})

		before(function(){
			return knex
			.insert(users[1])
			.into('users')
			.then(function(id){
				users[1].id = id[0];

				passwords[users[1].username][0].owner = id[0];
				passwords[users[1].username][1].owner = id[0];
				passwords[users[1].username][2].owner = id[0];

			});
		})

		var passwords = {};
		passwords[users[0].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedToMe-Title001',
				username 	: 'SharedPassword-FindSharedToMe-User001',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedToMe-Title002',
				username 	: 'SharedPassword-FindSharedToMe-User002',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedToMe-Title003',
				username 	: 'SharedPassword-FindSharedToMe-User003',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		passwords[users[1].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedToMe-Title011',
				username 	: 'SharedPassword-FindSharedToMe-User011',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedToMe-Title012',
				username 	: 'SharedPassword-FindSharedToMe-User012',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-FindSharedToMe-Title013',
				username 	: 'SharedPassword-FindSharedToMe-User013',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		// User[0] passwords
		before(function(){
			var password = passwords[users[0].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});

		// User[1] passwords
		before(function(){
			var password = passwords[users[1].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});


		// Create shares from User[0] -> User[1]
		before(function(){
			return knex
			.insert({
				owner: users[1].id,
				origin_owner: users[0].id,
				parent: null,
				origin_password: passwords[users[0].username][0].id,
				password: 'c29tZW90aGVycGFzc3dvcmQ='
			})
			.into('shared_passwords')
			.then( );
		});
		before(function(){
			return knex
			.insert({
				owner: users[1].id,
				origin_owner: users[0].id,
				parent: null,
				origin_password: passwords[users[0].username][2].id,
				password: 'c29tZW90aGVycGFzc3dvcmQ='
			})
			.into('shared_passwords')
			.then( );
		});

		it('returns a list of shared passwords, WITH inherited values', function(){
			return User.find(users[1].id)
			.then(SharedPassword.findAllSharedToMe)
			.then(function(sharedPasswords){
				assert.equal(sharedPasswords.length, 2);

				var _passwords = passwords[users[0].username]

				// SharedPassword[0]
				// Origin Values
				assert.equal(sharedPasswords[0].origin_owner, 	 	users[0].id)
				assert.equal(sharedPasswords[0].origin_password, 	_passwords[0].id);

				// Inherited from Origin
				assert.equal(sharedPasswords[0].title, 				_passwords[0].title);
				assert.equal(sharedPasswords[0].username,			_passwords[0].username);
				assert.equal(sharedPasswords[0].url, 				_passwords[0].url);
				assert.equal(sharedPasswords[0].note, 				_passwords[0].note);

				// User Shared To
				assert.equal(sharedPasswords[0].owner, 				users[1].id);
				assert.equal(sharedPasswords[0].parent,				null);
				assert.notEqual(sharedPasswords[0].password,		_passwords[0].password);

				// SharedPassword[1]
				// Origin Values
				assert.equal(sharedPasswords[1].origin_owner, 		users[0].id)
				assert.equal(sharedPasswords[1].origin_password,	_passwords[2].id);

				// Inherited from Origin
				assert.equal(sharedPasswords[1].title, 				_passwords[2].title);
				assert.equal(sharedPasswords[1].username,			_passwords[2].username);
				assert.equal(sharedPasswords[1].url, 				_passwords[2].url);
				assert.equal(sharedPasswords[1].note, 				_passwords[2].note);

				// User Shared To
				assert.equal(sharedPasswords[0].owner, 				users[1].id);
				assert.equal(sharedPasswords[0].parent,				null);
				assert.notEqual(sharedPasswords[0].password,		_passwords[2].password);

				return;
			});
		});

		it('returns an empty list, when the user has not been shared any passwords', function(){
			return User.find(users[0].id)
			.then(SharedPassword.findAllSharedToMe)
			.then(function(sharedPasswords){
				assert.equal(sharedPasswords.length, 0);
			});
		});


		after(function(){
			return knex
			.del()
			.from('shared_passwords')
			.where('origin_owner', users[0].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('passwords')
			.where('owner', users[0].id)
			.orWhere('owner', users[1].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('users')
			.where('id', users[0].id)
			.orWhere('id', users[1].id)
			.then();
		});
	});

	describe('#create', function(){

		var users = [
			{
				username: 'SharedPassword-FindSharedToMe-User01',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			},
			{
				username: 'SharedPassword-FindSharedToMe-User02',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			}
		];

		before(function(){
			return knex
			.insert(users[0])
			.into('users')
			.then(function(id){
				users[0].id = id[0];

				passwords[users[0].username][0].owner = id[0];
				passwords[users[0].username][1].owner = id[0];
				passwords[users[0].username][2].owner = id[0];

			});
		})

		before(function(){
			return knex
			.insert(users[1])
			.into('users')
			.then(function(id){
				users[1].id = id[0];

				passwords[users[1].username][0].owner = id[0];
				passwords[users[1].username][1].owner = id[0];
				passwords[users[1].username][2].owner = id[0];

			});
		})

		var passwords = {};
		passwords[users[0].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-Create-Title001',
				username 	: 'SharedPassword-Create-User001',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-Create-Title002',
				username 	: 'SharedPassword-Create-User002',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-Create-Title003',
				username 	: 'SharedPassword-Create-User003',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		passwords[users[1].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-Create-Title011',
				username 	: 'SharedPassword-Create-User011',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-Create-Title012',
				username 	: 'SharedPassword-Create-User012',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'SharedPassword-Create-Title013',
				username 	: 'SharedPassword-Create-User013',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		// User[0] passwords
		before(function(){
			var password = passwords[users[0].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});

		// User[1] passwords
		before(function(){
			var password = passwords[users[1].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});

		describe('Fails due to non-existant references', function(){
			
			it('fails to create shared password of non-existant password', function(){
				var shared = {
					owner: users[1].id, 
					origin_owner: users[0].id, 
					password: 'c29tZW90aGVycGFzc3dvcmQ=',
					origin_password: 1337
				}

				return SharedPassword.create(shared)
				.then(function(){
                	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
				})
				.catch(PasswordDoesNotExistError, function(err){
					assert.equal(err.message, 'Password ID 1337 was not found');
				});
			});

			it('fails to create shared password, when the target user is non-existant', function(){
				var shared = {
					owner: users[1].id, 
					origin_owner: 1337, 
					password: 'c29tZW90aGVycGFzc3dvcmQ=',
					origin_password: passwords[users[0].username][0].id
				}

				return SharedPassword.create(shared)
				.then(function(){
                	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
				})
				.catch(UserDoesNotExistError, function(err){
					assert.equal(err.message, 'User ID 1337 was not found');
				});
			});

			it('fails to create shared password, when the source user is non-existant', function(){		
				var shared = {
					owner: 1337, 
					origin_owner: users[0].id, 
					password: 'c29tZW90aGVycGFzc3dvcmQ=',
					origin_password: passwords[users[0].username][0].id
				}

				return SharedPassword.create(shared)
				.then(function(){
                	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
				})
				.catch(UserDoesNotExistError, function(err){
					assert.equal(err.message, 'User ID 1337 was not found');
				});
			});
		});

		it('success fully creates a shared password', function(){

			var shared = {
				owner: users[1].id, 
				origin_owner: users[0].id, 
				password: 'c29tZW90aGVycGFzc3dvcmQ=',
				origin_password: passwords[users[0].username][0].id
			}

			return SharedPassword.create(shared)
			.then(function(shared){
				return knex('shared_passwords')
				.select()
				.where('origin_password', shared.origin_password)
				.then(function(sharedPassword){
					assert.equal(sharedPassword.length, 1);
					
					assert.equal(sharedPassword[0].owner, shared.owner);
					assert.equal(sharedPassword[0].origin_owner, shared.origin_owner);
					assert.equal(sharedPassword[0].password, shared.password);
					assert.equal(sharedPassword[0].origin_password, shared.origin_password);

				});

			});
		});


		after(function(){
			return knex
			.del()
			.from('shared_passwords')
			.where('origin_owner', users[0].id)
			.orWhere('origin_owner', users[1].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('passwords')
			.where('owner', users[0].id)
			.orWhere('owner', users[1].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('users')
			.where('id', users[0].id)
			.orWhere('id', users[1].id)
			.then();
		});
	});

});