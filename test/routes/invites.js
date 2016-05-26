process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var _					= require('underscore');

var uuid				= require('uuid');
var moment 				= require('moment');

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);
var knex 				= require(__base + 'database.js');

describe("API /invites", function(){
	
	describe('POST', function(){

		var users = {
			admin: {
				username 	: 'Routes#Invites#POST#Admin',
				isAdmin 	: true,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='

			},
			user: {
				username 	: 'Routes#Invites#POST#User',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='

			}
		}

		var tokens = { admin: undefined, user: undefined };

		var createdInvites = [];

		before(function(){
			var USER = 'admin';
			return knex('users')
			.insert(users[USER])
			.then(function(ids){
				users[USER].id = ids[0];
			});
		});

		before(function(done){
			var USER = 'admin';

			server
			.post('/api/auth/login')
			.field('username', users[USER].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[USER] = res.body.token;
				return done();
			});
		});

		before(function(){
			var USER = 'user';
			return knex('users')
			.insert(users[USER])
			.then(function(ids){
				users[USER].id = ids[0];
			});
		});

		before(function(done){
			var USER = 'user';

			server
			.post('/api/auth/login')
			.field('username', users[USER].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[USER] = res.body.token;
				return done();
			});
		});


		it('should not allow creation of invite, without an auth token', function(done){
			server
			.post('/api/invites')
			.expect(401)
			.end(function(err, res){
				if(err) return done(err);	

				assert.equal(res.body.message, 'No Authorization header was found');
				assert.equal(res.body.code,  'UnauthorizedError');

				return done();
			});
		});

		it('should not allow a regular user to create an invite', function(done){
			server
			.post('/api/invites')
			.set('Authorization', 'Bearer ' + tokens['user'])
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});

		it('should allow an admin to create an invite', function(done){
			server
			.post('/api/invites')
			.set('Authorization', 'Bearer ' + tokens['admin'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
				assert.equal( pattern.test(res.body), true) ;

				createdInvites.push(res.body);

				return done();
			});
		});

		after(function(){
			return knex('audit')
			.del()
			.then();
		});

		after(function(){
			return knex('users')
			.where('username', users['admin'].username)
			.orWhere('username', users['user'].username)
			.del()
			.then(function(){
				return knex('invites')
				.whereIn('link', createdInvites)
				.del()
			})
			.then(function(){

			});
		});
	});
});

describe('API /invites/:inviteId/accept', function(){
	describe('POST', function(){

		var users = {
			admin: {
				username 	: 'Routes#Invites/:inviteId/accept#POST#Admin',
				isAdmin 	: true,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='

			},
			user: {
				username 	: 'Routes#Invites/:inviteId/accept#POST#User',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='

			}
		}

		var tokens = { admin: undefined, user: undefined };

		var createdInvites = [];

		before(function(){
			var USER = 'admin';
			return knex('users')
			.insert(users[USER])
			.then(function(ids){
				users[USER].id = ids[0];
			});
		});

		before(function(done){
			var USER = 'admin';

			server
			.post('/api/auth/login')
			.field('username', users[USER].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[USER] = res.body.token;
				return done();
			});
		});

		before(function(){
			var USER = 'user';
			return knex('users')
			.insert(users[USER])
			.then(function(ids){
				users[USER].id = ids[0];
			});
		});

		before(function(done){
			var USER = 'user';

			server
			.post('/api/auth/login')
			.field('username', users[USER].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[USER] = res.body.token;
				return done();
			});
		});

		var dbUsers = [
			{
				username 	: 'Routes#Invites/:inviteId/accept#POST#User01',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='

			}
		]


		var newUsers = [
			{
				username 	: 'Routes#Invites/:inviteId/accept#POST#User01',
				password 	: 'password',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			{
				username 	: 'Routes#Invites/:inviteId/accept#POST#User02',
				password 	: 'password',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			{
				username 	: 'Routes#Invites/:inviteId/accept#POST#User03',
				password 	: 'password',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			{
				username 	: 'Routes#Invites/:inviteId/accept#POST#User04',
				password 	: 'password',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			}
		];

		before(function(){
			return knex('users').insert(dbUsers[0]).then();
		});

		var invites = [
			{
				link: uuid.v4(),
				expires: moment().add(24, 'hours').unix(),
				used: true
			},
			{
				link: uuid.v4(),
				expires: moment().subtract(24, 'hours').unix(),
				used: false
			},
			{	link: uuid.v4(),
				expires: moment().add(24, 'hours').unix(),
				used: false
			}
		]

		before(function(){
			return knex('invites').insert(invites).then();
		});

		it('should return an error when the invite link is invalid format', function(done){
			server
			.post('/api/invites/' + 'ThisIsClearlyAPotato' + '/accept')
			.send(newUsers[0])
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);
				
				assert.equal(res.body.code, 'BadRequestError');

				return done();
			});
		});

		it('should return an error when the invite link does not exist', function(done){
			server
			.post('/api/invites/' + uuid.v4() + '/accept')
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);
				
				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'Invite was not found');

				return done();
			});
		});

		it('should return an error when the invite has already previously been used', function(done){
			server
			.post('/api/invites/' + invites[0].link + '/accept')
			.send(newUsers[1])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				return server
				.post('/api/invites/' + invites[0].link + '/accept')
				.send(newUsers[3])
				.expect(410)
				.end(function(err, res){

					assert.equal(res.body.code, 'NotFoundError');
					assert.equal(res.body.message, 'Invite was not found');

					return done();
				})

			});
		});

		it('should return an error when the invite has expired', function(done){
			server
			.post('/api/invites/' + invites[1].link + '/accept')
			.expect(410)
			.end(function(err, res){
				if(err) return done(err);
				
				assert.equal(res.body.code, 'GoneError');
				assert.equal(res.body.message, 'Invite is expired');

				return done();
			});
		});
	
		it('should return an error when the user already exists', function(done){
			server
			.post('/api/invites/' + invites[2].link + '/accept')
			.send(newUsers[0])
			.expect(400, {
				code: 'BadRequestError',
				message: 'Username already exists'
			}, done);
		});

		it('should return an error when a field in the user object is missing', function(done){
			server
			.post('/api/invites/' + invites[2].link + '/accept')
			.send( _.omit(newUsers[1], 'publickey') )
			.expect(400)
			.expect({
				code: 'BadRequestError',
				message: 'Validation error',
				errors: [
					{field: 'publickey',
					error: 'is required'}
				]
			})
			.end(done);
		});

		it('should return an error when a field in the user object has wrong format', function(done){
			newUsers[2].publickey = 'aaa';

			server
			.post('/api/invites/' + invites[2].link + '/accept')
			.send( _.omit(newUsers[2], 'publickey') )
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);


				return done();
			});
		});
		
		after(function(){
			return knex('audit')
			.del()
			.then();
		});

		after(function(){
			return knex('users')
			.where('username', users['admin'].username)
			.orWhere('username', users['user'].username)
			.orWhere('username', newUsers[0].username)
			.orWhere('username', newUsers[1].username)
			.orWhere('username', newUsers[2].username)
			.orWhere('username', newUsers[3].username)
			.del()
			.then(function(){
				return knex('invites')
				.whereIn('link', _.pluck(invites, 'link'))
				.del();
			})
			.then(function(){

			});
		});

	});

});