"use strict";

var assert = require('assert');

const fs 		= require('fs');
const base64 	= require(__base + 'helpers/base64.js');
const _ 		= require('underscore');

const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');

const unittestData = require(__base + 'misc/unitTestData.js');

describe('Models', function(){

	describe("User", function(){
		
		var User = require('../model/user.js');
	
		var validUser;

		before(function(done){

			validUser = {
				username: 'Darth Vader',
				isAdmin: true,
				password: 'password',
				privatekey: base64.encode(fs.readFileSync('misc/unittest-private.key').toString('utf8')),
				publickey: base64.encode(fs.readFileSync('misc/unittest-public.crt').toString('utf8'))
			}
			done();
		});

		describe('#create', function(){

			it('succeeds in creating new user', function(){
				return User.create(validUser)
				.then(function(user){
					//console.log(h);
					assert.equal(user.id, 3);
					assert.equal(user.username, validUser.username);
					assert.equal(user.isAdmin, validUser.isAdmin);
					assert.equal(user.privatekey, validUser.privatekey);
					assert.equal(user.publickey, validUser.publickey);
				});
			});

			it('fails when creating a user with already existing username', function(){
				var temp = _.clone(validUser);
				temp.username = unittestData.userData[0].username;
				return User.create(temp)
				.then(function(user){
					assert.fail(user);
				})
				.catch(SqlError, function(err){
					assert.equal(err.message, 'Username already exists');
				});
			})

			describe('missing fields', function(){ 
				it('should throw error when creating a new user with undefined data', function(){
					return User.create(undefined)
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is required');
						assert.equal(err.property, 'data');
					});
				});

				it('should throw error when creating a new user with undefined username', function(){
					return User.create( _.omit(validUser, 'username') )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is required');
						assert.equal(err.property, 'data.username');
					});
				});

				it('should throw error when creating a new user with undefined admin bool', function(){
					return User.create( _.omit(validUser, 'isAdmin') )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is required');
						assert.equal(err.property, 'data.isAdmin');
					});
				});

				it('should throw error when creating a new user with undefined password', function(){
					return User.create( _.omit(validUser, 'password') )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is required');
						assert.equal(err.property, 'data.password');
					});
				});
				
		
				it('should throw error when creating a new user with undefined publickey', function(){
					return User.create( _.omit(validUser, 'publickey') )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is required');
						assert.equal(err.property, 'data.publickey');
					});
				});

				it('should throw error when creating a new user with undefined privatekey', function(){
					return User.create( _.omit(validUser, 'privatekey') )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is required');
						assert.equal(err.property, 'data.privatekey');
					});
				});
			});
		
			describe('wrong field types', function(){
				it('should throw an error when creating a new user with data of wrong type', function(){
					return User.create(true)
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is the wrong type');
						assert.equal(err.property, 'data');
					});
				});

				it('should throw an error when creating a new user with username of wrong type', function(){
					var temp = _.clone(validUser);
					temp.username = true;
					return User.create( temp )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is the wrong type');
						assert.equal(err.property, 'data.username');
					});
				});

				it('should throw an error when creating a new user with admin bool of wrong type', function(){
					var temp = _.clone(validUser);
					temp.isAdmin = "true";
					return User.create( temp )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is the wrong type');
						assert.equal(err.property, 'data.isAdmin');
					});
				});

				it('should throw an error when creating a new user with password of wrong type', function(){
					var temp = _.clone(validUser);
					temp.password = true;
					return User.create( temp )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is the wrong type');
						assert.equal(err.property, 'data.password');
					});
				});

				it('should throw an error when creating a new user with privatekey of wrong type', function(){
					var temp = _.clone(validUser);
					temp.privatekey = true;
					return User.create( temp )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is the wrong type');
						assert.equal(err.property, 'data.privatekey');
					});
				});

				it('should throw an error when creating a new user with publickey of wrong type', function(){
					var temp = _.clone(validUser);
					temp.publickey = true;
					return User.create( temp )
					.then(function(user){
						assert.fail();
					})
					.catch(ValidationError, function(err){
						assert.equal(err.cause, 'is the wrong type');
						assert.equal(err.property, 'data.publickey');
					});
				});
			});	
		});

		describe('#find', function(){
			it('should fail when trying to find a non-existant id', function(){
				return User.find(1337)
				.then(function(user){
					assert.fail();
				})
				.catch(UserDoesNotExistError, function(err){
					assert.equal(err.message, 1337);
				});
			});

			it('should fetch user when finding existing id', function(){
				return User.find(1)
				.then(function(user){
					assert.equal(1, 									user.id);

					assert.equal(unittestData.userData[0].username, 	user.username);
					assert.equal(unittestData.userData[0].isadmin, 		user.isadmin);
					assert.equal(unittestData.userData[0].privatekey, 	user.privatekey);
					assert.equal(unittestData.userData[0].publickey, 	user.publickey);
				});
			});

			it('should fail when given wrong input type', function(){
				return User.find(true)
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.message, 'wrong type');
					assert.equal(err.property, 'id');
				});
			})
		});

		describe('#put', function(){
			it('update username AND password', function(){
				var oldValues = undefined;
				return User.find(3)
				.then(function(user){
					oldValues = _.clone(user);
					return user.update({username: 'Darth Maul', password: 'DeathToTheJedi'})
				})
				.then(function(updatedUser){
					// check username, password and salt changed
					assert.equal(updatedUser.username, 'Darth Maul');
					assert.notEqual(oldValues.salt, updatedUser.salt);
					assert.notEqual(oldValues.password, updatedUser.password);

					// check other fields are the same
					assert.equal(oldValues.id, updatedUser.id);
					assert.equal(oldValues.isAdmin, updatedUser.isAdmin);
					assert.equal(oldValues.privatekey, updatedUser.privatekey);
					assert.equal(oldValues.publickey, updatedUser.publickey);
				});
			});

			it('update username', function(){
				var oldValues = undefined;
				return User.find(3)
				.then(function(user){
					oldValues = _.clone(user);
					return user.update({username: 'Darth Sidious'})
				})
				.then(function(updatedUser){
					// check username has changed
					assert.equal(updatedUser.username, 'Darth Sidious');

					// ensure other values are the same
					assert.equal(oldValues.id, updatedUser.id);
					assert.equal(oldValues.isAdmin, updatedUser.isAdmin);
					assert.equal(oldValues.privatekey, updatedUser.privatekey);
					assert.equal(oldValues.publickey, updatedUser.publickey);
					assert.equal(oldValues.salt, updatedUser.salt);
					assert.equal(oldValues.password, updatedUser.password);
				});
			})
		})
	});

});
