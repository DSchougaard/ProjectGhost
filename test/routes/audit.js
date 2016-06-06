process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var _					= require('underscore');
const moment 			= require('moment');

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);
var knex 				= require(__base + 'database.js');

describe("API /user/:userId/audit", function(){

	{
		var users = [
			{
				username 	: 'Routes#Audit#Get#User-01',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='

			},
			{
				username 	: 'Routes#Audit#Get#User-02',
				isAdmin 	: true,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='

			}
		];

		before(function(){
			return knex('users')
			.insert(users[0])
			.then(function(ids){
				users[0].id = ids[0];

				for( var i = 0 ; i < auditLog.length ; i++ ){
					auditLog[i].userId = users[0].id;
				}
			});
		});

		before(function(){
			return knex('users')
			.insert(users[1])
			.then(function(ids){
				users[1].id = ids[0];
			});
		});
		
		var tokens = [undefined, undefined];
		before(function(done){
			// Obtain auth token -- admin
			server
			.post('/api/auth/login')
			.field('username', users[0].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[0] = res.body.token;
				return done();
			});
		});
		before(function(done){
			// Obtain auth token -- admin
			server
			.post('/api/auth/login')
			.field('username', users[1].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[1] = res.body.token;
				return done();
			});
		});

		var actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE', ''];
		var auditLog = [
			{ userId: users[0].id, targetType: 'authenticated with two factor authentication', targetId: undefined, action: '', time: moment().unix(), host: 'localhost' },
			{ userId: users[0].id, targetType: 'password', targetId: 1337, action: 0, time: moment().unix(), host: 'localhost'},
			{ userId: users[0].id, targetType: 'password', targetId: 1337, action: 1, time: moment().unix(), host: 'localhost'},
			{ userId: users[0].id, targetType: 'password', targetId: 1337, action: 2, time: moment().unix(), host: 'localhost'},
			{ userId: users[0].id, targetType: 'password', targetId: 1337, action: 3, time: moment().unix(), host: 'localhost'}
		];

		before(function(){
			return knex('audit')
			.del()
			.where('userId', users[0].id)
			.orWhere('userId', users[1].id)
			.then();
		})

		before(function(){
			return knex('audit')
			.insert(auditLog)
			.then();
		});
	}// End Create Test Data

	it('A user can get his own audit log', function(done){
		server
		.get('/api/users/'+users[0].id+'/audit')
		.set('Authorization', 'Bearer ' + tokens[0])
		.expect(function(res){

			assert.equal(res.body.length, 5);

			// Log Entry no 1
			assert.equal(res.body[0].userId, 		auditLog[0].userId);
			assert.equal(res.body[0].targetType, 	auditLog[0].targetType);
			assert.equal(res.body[0].targetId, 		auditLog[0].targetId);
			assert.equal(res.body[0].action, 		undefined);
			assert.equal(res.body[0].time, 			auditLog[0].time);

			assert.equal(res.body[1].userId, 		auditLog[1].userId);
			assert.equal(res.body[1].targetType, 	auditLog[1].targetType);
			assert.equal(res.body[1].targetId, 		auditLog[1].targetId);
			assert.equal(res.body[1].action, 		actions[auditLog[1].action]);
			assert.equal(res.body[1].time, 			auditLog[1].time);

			assert.equal(res.body[2].userId, 		auditLog[2].userId);
			assert.equal(res.body[2].targetType, 	auditLog[2].targetType);
			assert.equal(res.body[2].targetId, 		auditLog[2].targetId);
			assert.equal(res.body[2].action, 		actions[auditLog[2].action]);
			assert.equal(res.body[2].time, 			auditLog[2].time);

			assert.equal(res.body[3].userId, 		auditLog[3].userId);
			assert.equal(res.body[3].targetType, 	auditLog[3].targetType);
			assert.equal(res.body[3].targetId, 		auditLog[3].targetId);
			assert.equal(res.body[3].action, 		actions[auditLog[3].action]);
			assert.equal(res.body[3].time, 			auditLog[3].time);

			assert.equal(res.body[4].userId, 		auditLog[4].userId);
			assert.equal(res.body[4].targetType, 	auditLog[4].targetType);
			assert.equal(res.body[4].targetId, 		auditLog[4].targetId);
			assert.equal(res.body[4].action, 		actions[auditLog[4].action]);
			assert.equal(res.body[4].time, 			auditLog[4].time);
		})	
		.expect(200, done);
	});

	it('an admin can get a users audit log', function(done){
		server
		.get('/api/users/'+users[0].id+'/audit')
		.set('Authorization', 'Bearer ' + tokens[1])
		.expect(function(res){

			assert.equal(res.body.length, 5);

			// Log Entry no 1
			assert.equal(res.body[0].userId, 		auditLog[0].userId);
			assert.equal(res.body[0].targetType, 	auditLog[0].targetType);
			assert.equal(res.body[0].targetId, 		auditLog[0].targetId);
			assert.equal(res.body[0].action, 		undefined);
			assert.equal(res.body[0].time, 			auditLog[0].time);

			assert.equal(res.body[1].userId, 		auditLog[1].userId);
			assert.equal(res.body[1].targetType, 	auditLog[1].targetType);
			assert.equal(res.body[1].targetId, 		auditLog[1].targetId);
			assert.equal(res.body[1].action, 		actions[auditLog[1].action]);
			assert.equal(res.body[1].time, 			auditLog[1].time);

			assert.equal(res.body[2].userId, 		auditLog[2].userId);
			assert.equal(res.body[2].targetType, 	auditLog[2].targetType);
			assert.equal(res.body[2].targetId, 		auditLog[2].targetId);
			assert.equal(res.body[2].action, 		actions[auditLog[2].action]);
			assert.equal(res.body[2].time, 			auditLog[2].time);

			assert.equal(res.body[3].userId, 		auditLog[3].userId);
			assert.equal(res.body[3].targetType, 	auditLog[3].targetType);
			assert.equal(res.body[3].targetId, 		auditLog[3].targetId);
			assert.equal(res.body[3].action, 		actions[auditLog[3].action]);
			assert.equal(res.body[3].time, 			auditLog[3].time);

			assert.equal(res.body[4].userId, 		auditLog[4].userId);
			assert.equal(res.body[4].targetType, 	auditLog[4].targetType);
			assert.equal(res.body[4].targetId, 		auditLog[4].targetId);
			assert.equal(res.body[4].action, 		actions[auditLog[4].action]);
			assert.equal(res.body[4].time, 			auditLog[4].time);
		})	
		.expect(200, done);
	});

	it('returns an empty list for a user without any entries', function(done){
		server
		.get('/api/users/'+users[1].id+'/audit')
		.set('Authorization', 'Bearer ' + tokens[1])
		.expect(function(res){
			assert.equal(res.body.length, 0);
		})
		.expect(200, done);
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
			.where('username', users[0].username)
			.orWhere('username', users[1].username);
		});
	}

});