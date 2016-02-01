"use strict";

var Promise = require('bluebird');

var assert = require('assert');

const fs 		= require('fs');
const base64 	= require(__base + 'helpers/base64.js');
const _ 		= require('underscore');
const bcrypt 	= require('bcrypt');
const jwt 		= require('jsonwebtoken');
const moment 	= require('moment');

// Private and Public Key for Signing JWTs
const privateKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.key');
const publicKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.crt');


const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');

const unittestData = require(__base + 'misc/unitTestData.js');

var knex = require(__base + 'database.js');

var authentication = require(__base + 'middlewares/authentication.js');

describe('Authentication', function(){

	var testUser = {
		username: 'AuthenticationMiddlewareUser',
		isAdmin: false,
		privatekey: base64.encode('privatekey'),
		publickey: base64.encode('publickey')
	};

	before(function(){
		testUser.salt =  bcrypt.genSaltSync();
		testUser.password =  bcrypt.hashSync('password', testUser.salt);

		return knex('users')
		.insert(testUser)
		.then(function(ids){
			testUser.id = ids[0];
		});
	});

	var validToken = {
		iat: moment().unix(),
		exp: moment().add(14, 'days').unix()
	};
	
	var expiredToken = {
		iat: 0,
		exp: 100
	};

	var futureToken = {
		iat: moment().unix()+1500000,
		exp: moment().add(14, 'days').unix()+1500000
	};

	var nonExistingUserToken = {
		uid: 1337,
		iat: moment().unix(),
		exp: moment().add(14, 'days').unix()
	}

	var invalidToken = {
		iat: moment().unix(),
		exp: moment().add(14, 'days').unix()
	}

	before(function(done){
		validToken.uid 	= testUser.id;
		expiredToken.uid 	= testUser.id;
		futureToken.uid 	= testUser.id;
		invalidToken.uid 	= testUser.id;

		validToken 		= jwt.sign(validToken, privateKey, {algorithm: 'RS256'});
		expiredToken 	= jwt.sign(expiredToken, privateKey, {algorithm: 'RS256'});
		futureToken 	= jwt.sign(futureToken, privateKey, {algorithm: 'RS256'});
		nonExistingUserToken 	= jwt.sign(nonExistingUserToken, privateKey, {algorithm: 'RS256'});


		var fakePrivateKey = fs.readFileSync(__base + 'misc/unittest-private.key');
		invalidToken 	= jwt.sign(invalidToken, fakePrivateKey, {algorithm: 'RS256'});

		return done();
	});



	
	it('should fail when no token is available', function(done){
		
		var req = {
			headers: {}
		}

		authentication(req, null, function(err){
			assert.equal(err.message, 'No Authorization header was found');
			assert.equal(err.statusCode, 401);

			assert.equal(err.body.code, 'UnauthorizedError');
			assert.equal(err.body.message, 'No Authorization header was found');
			return done();
		});
	});

	it('should allow access and resolve user object when valid token is present', function(done){
		
		var req = {
			headers: {
				authorization: 'Bearer ' + validToken
			}
		}

		authentication(req, null, function(err){
			assert.notEqual(req.resolved, undefined);
			assert.notEqual(req.resolved.user, undefined);
			assert.deepEqual(req.resolved.user, testUser);
			
			assert.equal(err, undefined);
			return done();
		});
	});

	it('should return no user exists error, when given a token for non-existing user', function(done){
		var req = {
			headers: {
				authorization: 'Bearer ' + nonExistingUserToken
			}
		}

		authentication(req, null, function(err){
			assert.equal(err.message, 'User was not found');
			assert.equal(err.statusCode, 400);

			assert.equal(err.body.code, 'BadRequestError');
			assert.equal(err.body.message, 'User was not found');

			return done();
		});
	});

	it('should return expired error, when given an expired token', function(done){
		var req = {
			headers: {
				authorization: 'Bearer ' + expiredToken
			}
		}

		authentication(req, null, function(err){
			assert.equal(err.message, 'Token has expired');
			assert.equal(err.statusCode, 401);

			assert.equal(err.body.code, 'UnauthorizedError');
			assert.equal(err.body.message, 'Token has expired');

			return done();
		});
	});

	it('should return error, when given token encrypted with other certificate', function(done){
		var req = {
			headers: {
				authorization: 'Bearer ' + invalidToken
			}
		}

		authentication(req, null, function(err){
			assert.equal(err.message, 'Invalid auth token');
			assert.equal(err.statusCode, 401);

			assert.equal(err.body.code, 'UnauthorizedError');
			assert.equal(err.body.message, 'Invalid auth token');

			return done();
		});
	})


	after(function(){
		return knex('users')
		.where('id', testUser.id)
		.del()
		.then(function(rows){

		});
	});
});