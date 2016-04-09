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
			title 		: 'SharedPassword-FindSharedFromMe-Title001',
			username 	: 'SharedPassword-FindSharedFromMe-User001',
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
				return Audit.report(user, 'localhost', password, 'READ')
			})
			.then(function(audit){
				return knex('audit')
				.select()
				.where('userId', user.id);
			})
			.then(function(rows){
				assert.equal(rows.length, 1);
			})
			
		})

	});





});
