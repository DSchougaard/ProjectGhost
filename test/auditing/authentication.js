process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var _					= require('underscore');
var speakeasy		 	= require("speakeasy");

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);
var knex 				= require(__base + 'database.js');

describe('Authentication', function(){

	function generateTemplateUser(username){
		return {
			username 	: 'Auditing#Authentication#' + username,
			isAdmin 	: false,
			salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
			password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
			privatekey 	: 'cGFzc3dvcmQ=',
			iv 			: 'cGFzc3dvcmQ=',
			pk_salt 	: 'cGFzc3dvcmQ=',
			publickey 	: 'cGFzc3dvcmQ='
		};
	}

	var userIds = [];

	describe('successful two-factor authentication', function(){

		var user = generateTemplateUser('User01');
		user.two_factor_enabled = true;
		user.two_factor_secret 	=  speakeasy.generateSecret().base32;

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){ 
				userIds.push(ids[0]);
				user.id = ids[0];
			});
		});

		it('successfully completes api request', function(done){
			var token = speakeasy.totp({
				secret: user.two_factor_secret,
				encoding: 'base32'
			});

			server
			.post('/api/auth/login')
			.field('username', user.username)
			.field('password', 'password')
			.field('twoFactorToken', token)
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'authenticated with two factor authentication' );
				assert.equal(rows[0].targetId, 		undefined);
				assert.equal(rows[0].action, 		6);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('non-successful two-factor authentication - token', function(){

		var user = generateTemplateUser('User02');
		user.two_factor_enabled = true;
		user.two_factor_secret 	=  speakeasy.generateSecret().base32;

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){ 
				userIds.push(ids[0]);
				user.id = ids[0];
			});
		});

		it('successfully completes api request', function(done){
			var secret = speakeasy.generateSecret();
			var token = speakeasy.totp({
				secret: secret.base32,
				encoding: 'base32'
			});

			server
			.post('/api/auth/login')
			.field('username', user.username)
			.field('password', 'password')
			.field('twoFactorToken', token)
			.expect(401, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'authentication (invalid token)' );
				assert.equal(rows[0].targetId, 		undefined);
				assert.equal(rows[0].action, 		7);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('non-successful two-factor authentication - credentials', function(){

		var user = generateTemplateUser('User03');
		user.two_factor_enabled = true;
		user.two_factor_secret 	=  speakeasy.generateSecret().base32;

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){ 
				userIds.push(ids[0]);
				user.id = ids[0];
			});
		});

		it('successfully completes api request', function(done){
			var token = speakeasy.totp({
				secret: user.two_factor_secret,
				encoding: 'base32'
			});

			server
			.post('/api/auth/login')
			.field('username', user.username)
			.field('password', 'password3123213123')
			.field('twoFactorToken', token)
			.expect(401, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'authentication (invalid credentials)' );
				assert.equal(rows[0].targetId, 		undefined);
				assert.equal(rows[0].action, 		7);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('successful authentication', function(){

		var user = generateTemplateUser('User04');

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){ 
				userIds.push(ids[0]);
				user.id = ids[0];
			});
		});

		it('successfully completes api request', function(done){

			server
			.post('/api/auth/login')
			.field('username', user.username)
			.field('password', 'password')
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'authenticated' );
				assert.equal(rows[0].targetId, 		undefined);
				assert.equal(rows[0].action, 		6);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('non-successful authentication', function(){

		var user = generateTemplateUser('User05');

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){ 
				userIds.push(ids[0]);
				user.id = ids[0];
			});
		});

		it('successfully completes api request', function(done){

			server
			.post('/api/auth/login')
			.field('username', user.username)
			.field('password', 'password123213123123')
			.expect(401, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'authentication (invalid credentials)' );
				assert.equal(rows[0].targetId, 		undefined);
				assert.equal(rows[0].action, 		7);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

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
});