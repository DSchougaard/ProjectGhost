"use strict";

const Promise 		= require('bluebird');
const assert 		= require('assert');
const _ 			= require('underscore');
const moment 		= require('moment');
const uuid 			= require('uuid');

const unittestData 	= require(__base + 'misc/unitTestData.js');
const knex 			= require(__base + 'database.js');

// Models
var Invite  		= require(__base + 'models/invite.js');

// Errors
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const InviteDoesNotExistError 	= require(__base + 'errors/InviteDoesNotExistError.js');
const InvalidInviteError 		= require(__base + 'errors/InvalidInviteError.js');
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
					assert.equal(invite.expires.unix(), rows[0].expires);
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

		var invites = [
			{
				used: false,
				link: uuid.v4(),
				expires: moment().subtract(10, 'days').unix()
			}
		];

		var createdInvite = undefined;

		before(function(){
			return knex('invites')
			.insert(invites[0])
			.then(function(rows){
				invites[0].id = rows[0];
			});
		})

		var users = [
			{
				username 	: 'Models#Invite#Use#User01',
				password 	: 'password',
				publickey 	: 'dGVzdA==',
				privatekey 	: 'dGVzdA==',
				pk_salt 	: 'dGVzdA==',
				iv 			: 'dGVzdA=='
			},
			{
				username 	: 'Models#Invite#Use#User02',
				password 	: 'password',
				publickey 	: 'dGVzdA==',
				privatekey 	: 'dGVzdA==',
				pk_salt 	: 'dGVzdA==',
				iv 			: 'dGVzdA=='
			},
			{
				username 	: 'Models#Invite#Use#User03',
				password 	: 'password',
				publickey 	: 'dGVzdA==',
				privatekey 	: 'dGVzdA==',
				pk_salt 	: 'dGVzdA==',
				iv 			: 'dGVzdA=='
			},
			{
				username 	: 'Models#Invite#Use#User04',
				password 	: 'password',
				publickey 	: 'dGVzdA==',
				privatekey 	: 'dGVzdA==',
				pk_salt 	: 'dGVzdA==',
				iv 			: 'dGVzdA=='
			},
			{
				username 	: 'Models#Invite#Use#User05',
				password 	: 'password',
				publickey 	: 'dGVzdA==',
				privatekey 	: 'dGVzdA==',
				pk_salt 	: 'dGVzdA==',
				iv 			: 'dGVzdA=='
			}									
		]

		it('successfully creates a user, using an invite', function(){
			return Invite.create()
			.then(function(invite){
				createdInvite = invite;
				return invite.use(users[0]);
			})
			.then(function(user){
				assert.equal(user.username, 	users[0].username);
				assert.equal(user.publickey, 	users[0].publickey);
				assert.equal(user.privatekey, 	users[0].privatekey);
				assert.equal(user.iv, 			users[0].iv);
				assert.equal(user.pk_salt, 		users[0].pk_salt);

				users[0].id = user.id;

			})
			.catch(function(err){
                assert.fail(undefined,undefined, 'Method failed, when it should have succeeded');
			})
		});

		it('should fail when trying to re-use an invite', function(){
			return Invite.find(createdInvite.link)
			.then(function(invite){
				return invite.use(users[1]);
			})
			.then(function(){
    	        assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(InvalidInviteError, function(err){
				assert.equal(err.message, 'Invite already used');
			});
		
		});

		it('fails at creating user, using spoofed invite', function(){
			var invite = new Invite({
				id: 123,
				link: 'de305d54-75b4-431b-adb2-eb6b9e546014',
				used: false,
				expires: moment().unix()
			});

			return invite.use(users[2])
			.then(function(user){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(InviteDoesNotExistError, function(err){
				assert.equal(err.message, invite.link);
			});
		});

		it('should not allow two users to be created using same invite', function(){
			return Invite.create()
			.then(function(invite){

				var promises = [];
				promises.push( invite.use(users[2]) );
				promises.push( invite.use(users[3]) );

				return Promise.all(promises).finally(function() {
					return Promise.settle(promises);
				})

			})
			.then(function(re){
				console.dir(re);
			})
			.catch(InvalidInviteError, function(err){
				assert.equal(err.message, 'Invite already used');
			});
		});

		it('should fail when trying to create a user using an expired invite', function(){
			return Invite.find(invites[0].link)
			.then(function(invite){
				return invite.use( users[4] );
			})
			.then(function(user){
    	        assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(InvalidInviteError, function(err){
				assert.equal(err.message, 'Invite is expired');
			});
		});

	});

});