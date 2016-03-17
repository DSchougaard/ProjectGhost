"use strict";

const Promise 		= require('bluebird');
const assert 		= require('assert');
const _ 			= require('underscore');
const moment 		= require('moment');

const unittestData 	= require(__base + 'misc/unitTestData.js');
const knex 			= require(__base + 'database.js');

// Models
var Invite  		= require(__base + 'models/invite.js');

// Errors
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const InviteDoesNotExistError 	= require(__base + 'errors/InviteDoesNotExistError.js');
const OperationalError 			= Promise.OperationalError;

describe.only('Invite', function(){

	describe('#create', function(){

		var deleteThis = [];

		it('successfully creates a new invite', function(){
			return Invite.create()
			.then(function(invite){
				assert.notEqual(invite.id, undefined);
				assert.notEqual(invite.expires, undefined);
				assert.notEqual(invite.link, undefined);

				assert.equal(invite.expires.isAfter( moment().unix() ), true);

				assert.equal(invite.used, false);

				deleteThis.push(invite.id);

				return knex('invites')
				.select()
				.where('id', invite.id)
				.then(function(rows){
					assert.equal(rows.length, 1);

					assert.equal(invite.id, rows[0].id);
					assert.equal(invite.expires, rows[0].expires);
					assert.equal(invite.link, rows[0].link);
					assert.equal(invite.used, rows[0].used);

				});
			});
		});

		after(function(){
			var promises = [];
			for( var i = 0 ; i < deleteThis.length ; i++ ){
				promises.push( knex('invites').where('id', deleteThis[i]).del() );
			}

			Promise.all(promises)
			.then(function(){

			});
		});
	});

	describe('#find', function(){
		var deleteThis = [];

		var createdLink = undefined;

		before(function(){
			return Invite.create()
			.then(function(invite){
				deleteThis.push(invite.id);
				createdLink = invite.link;
			});
		});

		it('finds an existing invite', function(){
			return Invite.find(createdLink)
			.then(function(invite){
				assert.notEqual(invite, undefined);

				assert.notEqual(invite.id, undefined);
				assert.notEqual(invite.expires, undefined);
				assert.notEqual(invite.link, undefined);

				assert.equal(invite.expires.isAfter( moment().unix() ), true);

				assert.equal(invite.used, false);

			});
		});

		it('returns an error when trying to find invalid invite link', function(){
			return Invite.find('asdasdsadasdsad')
			.then(function(invite){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data pattern mismatch.');
			});
		});

		it('returns an error when trying to find non-existant invite link', function(){
			return Invite.find('de305d54-75b4-431b-adb2-eb6b9e546014')
			.then(function(invite){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(InviteDoesNotExistError, function(err){
				assert.equal(err.message, 'de305d54-75b4-431b-adb2-eb6b9e546014');
			});	
		})



		after(function(){
			var promises = [];
			for( var i = 0 ; i < deleteThis.length ; i++ ){
				promises.push( knex('invites').where('id', deleteThis[i]).del() );
			}

			Promise.all(promises)
			.then(function(){

			});
		});
	});

	describe('#use', function(){
		var inviteUser = {
			username 	: 'Models#Invite#Use#User01',
			password 	: 'password',
			publickey 	: 'dGVzdA==',
			privatekey 	: 'dGVzdA==',
			pk_salt 	: 'dGVzdA==',
			iv 			: 'dGVzdA=='
		}				


		it('successfully creates a user, using an invite', function(){
			return Invite.create()
			.then(function(invite){
				console.log("Invite created..");
				return invite.use(inviteUser);
			})
			.then(function(user){
				assert.equal(user.username, 	inviteUser.username);
				assert.equal(user.publickey, 	inviteUser.publickey);
				assert.equal(user.privatekey, 	inviteUser.privatekey);
				assert.equal(user.iv, 			inviteUser.iv);
				assert.equal(user.pk_salt, 		inviteUser.pk_salt);
			})
			.catch(function(err){
                assert.fail(undefined,undefined, 'Method failed, when it should have succeeded');
			})

		});

	});





});