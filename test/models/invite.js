"use strict";

const Promise 		= require('bluebird');
const assert 		= require('assert');
const _ 			= require('underscore');
const moment 		= require('moment');
const uuid 			= require('uuid');

const knex 			= require(__base + 'database.js');

// Models
var Invite  		= require(__base + 'models/invite.js');
var User 	 		= require(__base + 'models/user.js');

// Errors
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const InviteDoesNotExistError 	= require(__base + 'errors/InviteDoesNotExistError.js');
const InvalidInviteError 		= require(__base + 'errors/InvalidInviteError.js');
const OperationalError 			= Promise.OperationalError;
const AlreadyExistError 		= require(__base + 'errors/Internal/AlreadyExistError.js');


describe('Invite', function(){

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
				//console.log("Created invite: %j", invite);
				deleteThis.push(invite.id);
				createdLink = invite.link;
			});
		});

		it('finds an existing invite', function(){
			return Invite.find(createdLink)
			.then(function(invite){
				//console.log("Found invite: %j", invite);

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

		var createdInviteIds = [];

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
			},
			{
				username 	: 'Models#Invite#Use#User06',
				password 	: 'password',
				publickey 	: 'dGVzdA==',
				privatekey 	: 'dGVzdA==',
				pk_salt 	: 'dGVzdA==',
				iv 			: 'dGVzdA=='
			}		
		]

		before(function(){
			return User.create(users[5])
			.then()
		})

		it('successfully creates a user, using an invite', function(){
			return Invite.create()
			.then(function(invite){
				createdInvite = invite;
				createdInviteIds.push(invite.id);
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
                console.dir(err);
                assert.fail(undefined,undefined, 'Method failed, when it should have succeeded');
			})
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
				assert.equal(err.message, 'Invite does not exist');
			});
		});

		it('should not allow two users to be created using same invite', function(){
			return Invite.create()
			.then(function(invite){

				invites.push(invite);

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
			.catch(InviteDoesNotExistError, function(err){
				assert.equal(err.message, 'Invite does not exist');
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

		it('should fail when using invite with invalid user information', function(){
			var invalidUser = {
				username 	: 'Models#Invite#Use#User01',
				password 	: 'password',
				publickey 	: 'dGVzdA',
				privatekey 	: 'dGVzdA==',
				pk_salt 	: 'dGVzdA==',
				iv 			: 'dGVzdA=='
			}

			// Publickey has wrong encoding

			return Invite.create()
			.then(function(invite){
				// for clean up
				createdInviteIds.push(invite.id);

				return invite.use(invalidUser);
			})
			.then(function(user){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data.publickey pattern mismatch.');
			});
		});

		it('should not mark the invite as used, when the user information is invalid', function(){
			var invalidUser = {
				username 	: 'Models#Invite#Use#User01',
				password 	: 'password',
				publickey 	: 'dGVzdA',
				privatekey 	: 'dGVzdA==',
				pk_salt 	: 'dGVzdA==',
				iv 			: 'dGVzdA=='
			}

			// Publickey has wrong encoding
			var carry = undefined;

			return Invite.create()
			.then(function(invite){
				// for clean up
				createdInviteIds.push(invite.id);

				return invite.use(invalidUser);
			})
			.then(function(user){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(ValidationError, function(err){

				return knex('invites')
				.select()
				.where('id', _.last(createdInviteIds))
				.then(function(db_invite){
					assert.equal(db_invite.length, 1);
					assert.equal(db_invite[0].used, false);
				});
			});
		});

		it('should throw an error when trying to create already existing user', function(){
			return Invite.create()
			.then(function(invite){
				return invite.use(users[5]);
			})
			.then(function(){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(AlreadyExistError, function(err){
				assert.equal(err.message, 'Username already exists');
			});
		});

		after(function(){
			return knex('users')
			.where('username', 		users[0].username)
			.orWhere('username', 	users[1].username)
			.orWhere('username', 	users[2].username)
			.orWhere('username', 	users[3].username)
			.orWhere('username', 	users[4].username)
			.orWhere('username', 	users[5].username)
			.del()
			.then(function(){});
		});

		after(function(){
			return knex('invites')
			.where('id', 	invites[0].id)
			.orWhere('id', 	createdInviteIds[0])
			.orWhere('id', 	createdInviteIds[1])
			.orWhere('id', 	createdInviteIds[2])
			.del()
			.then(function(){});
		});

	});

});