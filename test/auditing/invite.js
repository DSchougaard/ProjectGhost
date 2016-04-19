process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var _					= require('underscore');
var speakeasy		 	= require("speakeasy");

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);
var knex 				= require(__base + 'database.js');

describe('Invite', function(){

	function generateTemplateUser(username){
		return {
			username 	: 'Auditing#Invite#' + username,
			isAdmin 	: false,
			salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
			password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
			privatekey 	: 'cGFzc3dvcmQ=',
			iv 			: 'cGFzc3dvcmQ=',
			pk_salt 	: 'cGFzc3dvcmQ=',
			publickey 	: 'cGFzc3dvcmQ='
		};
	}

	var userIds = [];

	describe('makes an audit entry when an invite is created', function(){
		var user = generateTemplateUser('User01');
		user.isAdmin = true;
		var token = undefined;
		var inviteId = undefined;

		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);
				});
			});

			before(function(done){
				server
				.post('/api/auth/login')
				.field('username', user.username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					token = res.body.token;
					return done();
				});
			});

			// Flush audit log for ... Purposes	
			before(function(){
				return knex('audit')
				.del()
				.then();
			});
		}

		it('successfully completes api request', function(done){
			server
			.post('/api/invites')
			.set('Authorization', 'Bearer ' + token)
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'invite' );
				assert.notEqual(rows[0].targetId, 		undefined);
				assert.equal(rows[0].action, 		0);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});

		});
	});

	describe('makes an audit entry when an invite is used', function(){
		var users = [ generateTemplateUser('User02'), generateTemplateUser('User03') ];
		users[0].isAdmin = true;

		users[1] = 			_.omit(users[1], 'salt', 'isAdmin');
		users[1].password 	= 'password';

		var token 			= undefined;
		var invite 			= undefined;
		var inviteId 		= undefined;

		{
			before(function(){
				return knex('users')
				.insert(users[0])
				.then(function(ids){
					users[0].id = ids[0];
					userIds.push(users[0].id);
				});
			});

			before(function(done){
				server
				.post('/api/auth/login')
				.field('username', users[0].username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					token = res.body.token;
					return done();
				});
			});

			before(function(done){
				server
				.post('/api/invites')
				.set('Authorization', 'Bearer ' + token)
				.end(function(err, res){
					if(err) return done(err);

					invite = res.body;
					return done();
				});
			});

			before(function(){
				return knex('invites')
				.select()
				.where('link', invite)
				.then(function(rows){
					inviteId = rows[0].id;
				});
			});

			// Flush audit log for ... Purposes	
			before(function(){
				return knex('audit')
				.del()
				.then();
			});
		}

		it('successfully completes api request', function(done){
			server
			.post('/api/invites/'+invite+'/accept')
			.send(users[1])
			.expect(200)
			.expect(function(res){
				users[1].id = res.body.id;
				userIds.push(users[1].id);
			})
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', users[1].id)
			.then(function(rows){
				assert.equal(rows.length,  2);

				assert.equal(rows[0].userId,  		users[1].id);
				assert.equal(rows[0].targetType, 	'invite' );
				assert.equal(rows[0].targetId, 		inviteId);
				assert.equal(rows[0].action, 		3);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

				assert.equal(rows[1].userId,  		users[1].id);
				assert.equal(rows[1].targetType, 	'user' );
				assert.equal(rows[1].targetId, 		users[1].id);
				assert.equal(rows[1].action, 		0);
				assert.equal(rows[1].host, 			'127.0.0.1');
				assert.notEqual(rows[1].time, 		undefined);
			});
		});
	});


	{
		after(function(){
			return knex('audit')
			.del()
			.then();
		});

		after(function(){
			return knex('users')
			.del()
			.whereIn('id', userIds)
			.then();
		});

		after(function(){
			return knex('invites')
			.del()
			.then();
		});
	}

});