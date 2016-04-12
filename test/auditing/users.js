process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var _					= require('underscore');

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);
var knex 				= require(__base + 'database.js');

describe('Users', function(){

	{
		var users = [
			{
				username 	: 'Auditing#Users#User-01-Basic',
				isAdmin 	: true,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			{

				username 	: 'Auditing#Users#User-02-GetMe',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			{
				username 	: 'Auditing#Users#User-03-UpdateMe',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='

			},
			{			
				username 	: 'Auditing#Users#User-04-DeleteMe',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			}
		];

		var userIds = [];

		before(function(){
			var user = users[0];
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
				userIds.push(user.id);
			});
		});
		before(function(){
			var user = users[1];
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
				userIds.push(user.id);
			});
		});
		before(function(){
			var user = users[2];
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
				userIds.push(user.id);
			});
		});
		before(function(){
			var user = users[3];
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
				userIds.push(user.id);
			});
		});


		var tokens = [undefined, undefined, undefined, undefined];
		before(function(done){
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
		before(function(done){
			server
			.post('/api/auth/login')
			.field('username', users[2].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[2] = res.body.token;
				return done();
			});
		});
		before(function(done){
			server
			.post('/api/auth/login')
			.field('username', users[3].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[3] = res.body.token;
				return done();
			});
		});

	}

	//var actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE', ''];

	describe('makes an audit entry when getting a user gets the user collection', function(){
		// Flush audit log for ... Purposes	
		before(function(){
			return knex('audit')
			.del()
			.then();
		});

		it('successfully completes api request', function(done){
			server
			.get('/api/users')
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', users[0].id)
			.then(function(rows){
				assert.equal(rows.length, 1);

				assert.equal(rows[0].userId,  		users[0].id);
				assert.equal(rows[0].targetType, 	'user collection' );
				assert.equal(rows[0].targetId, 		undefined);
				assert.equal(rows[0].action, 		1);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});
		});
	});

	describe('makes an audit entry when a user gets his own data', function(){
		// Flush audit log for ... Purposes	
		before(function(){
			return knex('audit')
			.del()
			.then();
		});

		it('successfully completes api request', function(done){
			server
			.get('/api/users/me')
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', users[0].id)
			.then(function(rows){
				assert.equal(rows.length, 1);

				assert.equal(rows[0].userId,  		users[0].id);
				assert.equal(rows[0].targetType, 	'user' );
				assert.equal(rows[0].targetId, 		users[0].id);
				assert.equal(rows[0].action, 		1);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});
		});
	});

	describe.skip('makes an audit entry when a user another users data', function(){
		// Flush audit log for ... Purposes	
		before(function(){
			return knex('audit')
			.del()
			.then();
		});

		it('successfully completes api request', function(done){
			server
			.get('/api/users/'+users[1])
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(200, done);
		});

		it('verifies in the database for accessing user', function(){
			return knex('audit')
			.select()
			.where('userId', users[0].id)
			.then(function(rows){
				assert.equal(rows.length, 1);

				assert.equal(rows[0].userId,  		users[0].id);
				assert.equal(rows[0].targetType, 	'user' );
				assert.equal(rows[0].targetId, 		users[0].id);
				assert.equal(rows[0].action, 		1);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});
		});

		it('verifies in the database for accessed user', function(){
			return knex('audit')
			.select()
			.where('userId', users[0].id)
			.then(function(rows){
				assert.equal(rows.length, 1);

				assert.equal(rows[0].userId,  		users[0].id);
				assert.equal(rows[0].targetType, 	'user' );
				assert.equal(rows[0].targetId, 		users[0].id);
				assert.equal(rows[0].action, 		1);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});
		});
	});


	describe('makes an audit entry when a user is created', function(){
		before(function(){
			return knex('audit')
			.del()
			.then();
		});

		var user = {
			username 	: 'Auditing#Users#User-10-CreateMe',
			isAdmin 	: false,
			password 	: 'password',
			privatekey 	: 'cGFzc3dvcmQ=',
			iv 			: 'cGFzc3dvcmQ=',
			pk_salt 	: 'cGFzc3dvcmQ=',
			publickey 	: 'cGFzc3dvcmQ='
		};

		it('successfully completes api request', function(done){
			
			server
			.post('/api/users')
			.send(user)
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				userIds.push(res.body.id);
				user.id = res.body.id;

				return done();
			});

		});

		it('verifies in the database for accessing user', function(){
			return knex('audit')
			.select()
			.where('userId', users[0].id)
			.then(function(rows){
				assert.equal(rows.length, 1);

				assert.equal(rows[0].userId,  		users[0].id);
				assert.equal(rows[0].targetType, 	'user' );
				assert.equal(rows[0].targetId, 		user.id);
				assert.equal(rows[0].action, 		0);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});

		});
	});


	describe('makes an audit entry when a user is updated', function(){
		before(function(){
			return knex('audit')
			.del()
			.then();
		});

		it('successfully completes api request', function(done){
			
			server
			.put('/api/users/'+users[2].id)
			.send({publickey: 'SW1TdGFydGluZ1RvSGF0ZVRoaXNCYXNlNjQuLi4='})
			.set('Authorization', 'Bearer ' + tokens[2])
			.expect(200, done);
		});

		it('verifies in the database for accessing user', function(){
			
			return knex('audit')
			.select()
			.where('userId', users[2].id)
			.then(function(rows){
				assert.equal(rows.length, 1);

				assert.equal(rows[0].userId,  		users[2].id);
				assert.equal(rows[0].targetType, 	'user' );
				assert.equal(rows[0].targetId, 		users[2].id);
				assert.equal(rows[0].action, 		2);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});
		});
	});

	describe.skip('makes an audit entry when a user is deleted', function(){
		before(function(){
			return knex('audit')
			.del()
			.then();
		});

		it('successfully completes api request', function(done){
			
			server
			.del('/api/users/'+users[3].id)
			.send({publickey: 'SW1TdGFydGluZ1RvSGF0ZVRoaXNCYXNlNjQuLi4='})
			.set('Authorization', 'Bearer ' + tokens[3])
			.expect(200, done);
		});

		it('verifies in the database for accessing user', function(){
			
			return knex('audit')
			.select()
			.where('userId', users[3].id)
			.then(function(rows){
				assert.equal(rows.length, 1);

				assert.equal(rows[0].userId,  		users[3].id);
				assert.equal(rows[0].targetType, 	'user' );
				assert.equal(rows[0].targetId, 		users[3].id);
				assert.equal(rows[0].action, 		3);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});
		});
	});
	

	
	{
		after(function(){
			return knex('audit')
			.del()
			.then();
		})

		after(function(){
			return knex('users')
			.whereIn('id', userIds)
			.del()
			.then();
		})
	}

});