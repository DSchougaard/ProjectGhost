var assert 				= require('assert');
var request 			= require('supertest');  
var should 				= require('should');

var q 					= require('q');
var Promise 			= require("bluebird");

// Lib to be tested
var authorization 		= require('../helpers/authorization.js');


// Errors
const UnauthorizedError 		= require(__base + 'errors/UnauthorizedError.js');
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const PasswordDoesNotExistError 	= require(__base + 'errors/PasswordDoesNotExistError.js');

describe('Authorization Helper', function(){

	// Uses data from createUnitTestData
	var user = {
		id : 2
	}

	var adminUser = {
		id: 1
	}
	
	var knex;

	before(function(done){
		knex = require('knex')({
			client: 'sqlite',
			connection:{
				filename: 'unittest.sqlite'
			}
		});
		done();
	});

	// Read: https://stackoverflow.com/questions/23986313/mocha-times-out-on-failed-assertions-with-q-promises
	
	describe.only('User', function(){
		it('should allow user to change own data', function(){
			return authorization.isAuthorized(knex, authorization.types.user, user.id, user.id)
			.then(function(success){
				(success.result).should.be.true();
			})
			.catch(UnauthorizedError, function(err){
				should.fail();
			});
			/*, function(err){
				should.fail();
			});*/
		});

		it('should allow admin to change other users data', function(){
			return authorization.isAuthorized(knex, authorization.types.user, adminUser.id, user.id)
			.then(function(success){
				(success.result).should.be.true();
			})
			.catch(function(err){
				should.fail(err);
			});
		});

		it('should allow admin to change own data', function(){
			return authorization.isAuthorized(knex, authorization.types.user, adminUser.id, adminUser.id)
			.then(function(success){
				(success.result).should.be.true();
			})
			.catch(function(err){
				should.fail(err);
			});
		});

		it('should not allow user to change admins data', function(){
			return authorization.isAuthorized(knex, authorization.types.user, user.id, adminUser.id)
			.then(function(success){
				(success.result).should.equal(false);
			})
			.catch(function(err){
				should.fail(err);
			});
		});

		it('should fail when trying to use non-existing user', function() {
		
			return authorization.isAuthorized(knex, authorization.types.user, 1337, adminUser.id)
			.then(function(success){
				should.fail();
			})
			// Expected Exception
			.catch(UserDoesNotExistError, function(err){
				err.message.should.equal(1337);
			})
			.catch(function(otherErrs){
				should.fail();
			})
		});

		it('should fail when tring to to edit a non-existing user', function(){
			return authorization.isAuthorized(knex, authorization.types.user, user.id, 1337)
			.then(function(success){
				(success.result).should.equal(false);
			})
			.catch(UserDoesNotExistError, function(err){
				err.message.should.equal(1337);
			})
			.catch(function(err){
				should.fail(err);
			});
		});
	});

	describe('Password', function(){
		it('should allow an user to edit his own password', function(){
			return authorization.isAuthorized(knex, authorization.types.password, user.id, 4)
			.then(function(res){
				(res).should.equal(true);
			}).error(function(err){
				// No other errors should be thrown.
				should.fail();
			});
		});

		it('should allow and admin to edit his own password', function(){
			return authorization.isAuthorized(knex, authorization.types.password, adminUser.id, 1)
			.then(function(res){
				(res).should.equal(true);
			}).error(function(err){
				// No other errors should be thrown.
				should.fail();
			});
		});

		it('should not allow a user to edit another users password', function(){
			return authorization.isAuthorized(knex, authorization.types.password, user.id, 1)
			.then(function(res){
				should.fail();
			})
			.catch(UnauthorizedError, function(err){
				err.message.should.equal('Insufficient privileges')
			})
			.error(function(err){
				// No other errors should be thrown.
				should.fail();
			});
		});

		it('should fail when using a non-existing user ID', function(){
			return authorization.isAuthorized(knex, authorization.types.password, 1337, 1)
			.then(function(res){
				should.fail('sucess');
			})
			.catch(UserDoesNotExistError, function(err){
				err.message.should.equal(1337);
			}).error(function(err){
				// No other errors should be thrown.
				should.fail();
			});
		});

		it('should fail when using a non-existing password ID', function(){
			return authorization.isAuthorized(knex, authorization.types.password, user.id, 1337)
			.then(function(res){
				should.fail();
			})
			.catch(PasswordDoesNotExistError, function(err){
				err.message.should.equal(1337);
			}).error(function(err){
				// No other errors should be thrown.
				should.fail();
			});
		});

	});






	after(function(done){
		// Obtain auth token
		knex.destroy();
		done();
	});

});

