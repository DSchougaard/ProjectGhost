process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 	= require('assert');
var request = require('supertest');  
var should 	= require('should');
var sinon 	= require('sinon');

var knex 				= require(__base + 'database.js');
const certs 				= require(__base + 'test/certs.js');

var fs 		= require('fs');
var base64 	= require(__base + 'helpers/base64.js');
var jwt 	= require('jsonwebtoken');
var moment 	= require('moment');
const speakeasy		 			= require("speakeasy");

// SuperTest Connection
var server 	= request(require(__base + 'app.js').server);


function generateTemplateUser(username){
	return {
		username 	: 'API#Auth#' + username,
		salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
		password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
		privatekey 	: 'cGFzc3dvcmQ=',
		iv 			: 'cGFzc3dvcmQ=',
		pk_salt 	: 'cGFzc3dvcmQ=',
		publickey 	: 'cGFzc3dvcmQ='
	};
}

// Private and Public Key for Signing JWTs
const privateKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.key');
const publicKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.crt');


describe('API /auth', function(){
	describe('AuthToken without 2FA', function(){
		
		var user = generateTemplateUser('Without2FA-User001');

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
			});
		});

		it('returns an auth token for a user that exists', function(done){
			server
			.post('/api/auth/login')
			.field('username', user.username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				var token = res.body.token;

				jwt.verify(token, publicKey, function(err, decoded){
					if(err) done(err);

					(decoded).should.have.property('uid', user.id);
					(decoded).should.have.property('iat');
					(decoded).should.have.property('exp');

					done();
				});
			});	
		});

		it('fails when given a username that does not exist', function(done){
			server
			.post('/api/auth/login')
			.field('username', 'DoesNotExist')
			.field('password', 'password')
			.expect(401)
			.end(function(err, res){
				if(err) return done(err);

				(res.body.message).should.equal('Wrong login credentials');
				(res.body.code).should.equal('UnauthorizedError');
				done();
			});
		});
		
		it('it fails when given a wrong password', function(done){
			server
			.post('/api/auth/login')
			.field('username', user.username)
			.field('password', 'ThisIsNotThePasswordYouAreLookingFor')
			.expect(401)
			.end(function(err, res){
				if(err) return done(err);

				(res.body.message).should.equal('Wrong login credentials');
				(res.body.code).should.equal('UnauthorizedError');
				done();
			});
		});

		it('responds accordingly when request is empty', function(done){
			server
			.post('/api/auth/login')
			.field('password', user.password)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				(res.body.message).should.equal('Incomplete request: Missing username');
				(res.body.code).should.equal('BadRequestError');
				done();
			});
		});

		it('responds accordingly when username is missing', function(done){
			server
			.post('/api/auth/login')
			.field('password', user.password)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				(res.body.message).should.equal('Incomplete request: Missing username');
				(res.body.code).should.equal('BadRequestError');
				done();
			});
		});

		it('responds accordingly when password is missing', function(done){
			server
			.post('/api/auth/login')
			.field('username', user.username)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				(res.body.message).should.equal('Incomplete request: Missing password');
				(res.body.code).should.equal('BadRequestError');
				done();
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
			.then();
		})
	});

	describe('AuthToken with 2FA', function(){
		var users = [
			{
				username 	: 'Routes#Auth#User01',
				isAdmin 	: true,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ=',

			},
			{
				username 	: 'Routes#Auth#User02',
				isAdmin 	: true,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ=',
				two_factor_enabled: true,
				two_factor_secret:  speakeasy.generateSecret().base32
			}
		];


		var authTokens  = [undefined, undefined, undefined];

		before(function(){
			return knex('users').insert(users[0])
			.then(function(ids){
				users[0].id = ids[0];
			});
		});
		before(function(){
			return knex('users').insert(users[1])
			.then(function(ids){
				users[1].id = ids[0];
			});
		});		


		it('returns an error, when a user without 2fa enabled, passes token', function(done){
			var secret = speakeasy.generateSecret();
			var token = speakeasy.totp({
				secret: secret.base32,
				encoding: 'base32'
			});

			//users[0]
			server
			.post('/api/auth/login')
			.field('username', users[0].username)
			.field('password', 'password')
			.field('twoFactorToken', token)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.message, 'User has not enabled two-factor authentication');
				return done();
			});
		});

		it('returns an error, when a user with 2fa enabled does not pass a token', function(done){
			//users[1]
			server
			.post('/api/auth/login')
			.field('username', users[1].username)
			.field('password', 'password')
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.message, 'Missing two factor token');
				return done();
			});
		});

		it('returns an error when a user with 2fa enabled passes a wrong token', function(done){
			var token = speakeasy.totp({
				secret: users[1].two_factor_secret,
				encoding: 'base32',
				time: 0
			});

			//users[1]
			server
			.post('/api/auth/login')
			.field('username', users[1].username)
			.field('password', 'password')
			.field('twoFactorToken', token)
			.expect(401)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.message, 'Invalid token');
				return done();
			});
		});

		it('successfully logs in a user with 2fa enabled, when valid token is passed', function(done){

			var token = speakeasy.totp({
				secret: users[1].two_factor_secret,
				encoding: 'base32'
			});

			//users[1]
			server
			.post('/api/auth/login')
			.field('username', users[1].username)
			.field('password', 'password')
			.field('twoFactorToken', token)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
			
				var token = res.body.token;

				jwt.verify(token, publicKey, function(err, decoded){
					if(err) done(err);

					(decoded).should.have.property('uid', users[1].id);
					(decoded).should.have.property('iat');
					(decoded).should.have.property('exp');

					return done();
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
			.where('username', users[0].username)
			.orWhere('username', users[1].username)
			.del()
			.then();
		})

	});
	
	describe('Access to restricted areas', function(){
		
		var user = generateTemplateUser('AccessToRestrictedAreas-User001');
		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
			});
		});

		it('should grant access when a valid token is supplied', function(done){
			// Obtain valid token
			server
			.post('/api/auth/login')
			.field('username', user.username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				var validToken = res.body.token;

				// Use validToken to access protected API endpoint
				server
				.get('/api/auth/ping')
				.set('Authorization', 'Bearer ' + validToken)
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);

					(res.body).should.equal('OK');
					
					done();
				});
			});
		});

		it('should fail when no token is supplied', function(done){
			server
			.get('/api/auth/ping')
			.expect(401)
			.end(function(err, res){
				if(err) return done(err);
				(res.body.message).should.equal('No Authorization header was found');
				(res.body.code).should.equal('UnauthorizedError');
				done();
			});
		});

		it('should fail when a wrong token is supplied', function(done){			
			var payload = {
				uid: user.id,
				iat: moment().unix(),
				exp: moment().add(14, 'days').unix()
			};
			var badToken = jwt.sign(payload, certs.privateKey.raw, {algorithm: 'RS256'});

			server
			.get('/api/auth/ping')
			.set('Authorization', 'Bearer ' + badToken)
			.expect(401)
			.end(function(err, res){
				if(err) return done(err);

				(res.body.message).should.equal('Invalid auth token');
				(res.body.code).should.equal('UnauthorizedError');

				done();
			});
		});

		it('should fail when an expired token is supplied', function(done){
			var payload = {
				uid: user.id,
				iat: 0,
				exp: 20000
			};

			//var badToken = jwt.sign(payload, privateKey, {algorithm: 'RS256'});
			//var badToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOjEsImlhdCI6MTQ1Mjg2NTI4MSwiZXhwIjoyMDAwMH0.HUFZrEVRcICjfmPhRY-s2IZ6daRiGvZzr3_9MkuAmeU2AxhMYBPSvuGth81T7ELluBlXGp0fjuuKHTB-j2geKlI0R9X7gZ98ftE1oRmWadmLNsQy-Mvw9R0_MoLuBj7BOJzXGBjLVCtg0IQV9rKJOYdVe5dXo0z0BLMSoIJ3R2PkCrWUMmcePSvJq_aCORirPf4qQRX6CrTxUdauaNJ-FBFrLjkq5z9qatwOkE4H1lVZGeVxBbUwWudxAObh3YMR5eTX7pxUPI5EZQHYVIqKa3Vl7UKJAMHs-IL62PGYKKWcDeXhr1yMD-bOwRgLKOeD4q-8KPdyN46vMWSPs4Xnb72a6Orq6y9ngOFdDifTEPeYaUjQWU67Jy3YbdRs86O7LuT9E3Vv8aIHswVBiBiqqPiTt3MaxDlwkuCw-iXFwoB6pBFgnzJlGnyMRuY3mto4_g-i2MuPZ5_6V4jJT7m_iYpw0djbTkupdFHKpB96IxHgNhdQe9hTnvCBRzc_WvZW15Aty-8MD3-yeHDU-WTWF2lvs5lm50BTlMGroC4Sx3LGVBmVqQMmAhcj84uKsZT9mCKbLaKOsmprtr8fPsl8RcgbEipd3zYKT8v4bL4uDpZUufHeDx1VRBHCPqkWdPE0tsbjs78_RSzm7vtIg5BWetJ0VbcfdahpdceZwOi-_sY';
			var payload = {
				uid: user.id,
				iat: moment().unix(),
				exp: moment().subtract(14, 'days').unix(),
				lvl: 0	
			};

			const privateKey = fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.key');
			var badToken = jwt.sign(payload, privateKey, {algorithm: 'RS256'});

			server
			.get('/api/auth/ping')
			.set('Authorization', 'Bearer ' + badToken)
			.expect(401)
			.end(function(err, res){
				if(err) return done(err);

				(res.body.message).should.equal('Token has expired');
				(res.body.code).should.equal('UnauthorizedError');

				done();
			});
		});

		after(function(){
			return knex('audit')
			.del()
			.then();
		});
	});


	describe('POST /totp/generate', function(){

		var user = {
			username 	: 'Routes#Auth/totp/generate#User',
			isAdmin 	: true,
			salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
			password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
			privatekey 	: 'cGFzc3dvcmQ=',
			iv 			: 'cGFzc3dvcmQ=',
			pk_salt 	: 'cGFzc3dvcmQ=',
			publickey 	: 'cGFzc3dvcmQ='
		}

		var authToken  = undefined;

		before(function(){
			return knex('users').insert(user)
			.then(function(ids){
				user.id = ids[0];
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
				authToken = res.body.token;
				return done();
			});
		});

		it('should return an error when the user is not authenticated', function(done){
			server
			.post('/api/auth/totp/generate')
			.expect(401)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'UnauthorizedError');
				assert.equal(res.body.message, 'No Authorization header was found');

				return done();
			});
		});

		it('should generate a new 2fa url for an authenticated user', function(done){
			server
			.post('/api/auth/totp/generate')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				var regex = /otpauth:\/\/totp\/SecretKey\?secret\=[A-Z0-9]+/;

				assert.equal(regex.test(res.body), true);

				return done();
			});
		});

		it('should not propegate to the db, before the secret has been verified', function(){
			return knex('users')
			.select()
			.where('username', user.username)
			.then(function(users){
				assert.equal(users.length, 1);

				assert.equal(users[0].two_factor_secret, null);
				assert.equal(users[0].two_factor_enabled, 0);
			});
		});
		after(function(){
			return knex('audit')
			.del()
			.then();
		});
		after(function(){
			return knex('users')
			.where('username', user.username)
			.del()
			.then();
		})
	});


	describe('POST /totp/verify', function(){
		var users = [
			{
				username 	: 'Routes#Auth/totp/verifyspeak#User01',
				isAdmin 	: true,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ=',

			},
			{
				username 	: 'Routes#Auth/totp/verifyspeak#User02',
				isAdmin 	: true,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ=',
			},		
			{
				username 	: 'Routes#Auth/totp/verifyspeak#User03',
				isAdmin 	: true,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ=',
				two_factor_enabled: true,
				two_factor_secret:  speakeasy.generateSecret().base32

			},			
		]


		var authTokens  = [undefined, undefined, undefined];

		before(function(){
			return knex('users').insert(users[0])
			.then(function(ids){
				users[0].id = ids[0];
			});
		});
		before(function(){
			return knex('users').insert(users[1])
			.then(function(ids){
				users[1].id = ids[0];
			});
		});		
		before(function(){
			return knex('users').insert(users[2])
			.then(function(ids){
				users[2].id = ids[0];
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
				authTokens[0] = res.body.token;
				return done();
			});
		});
		before(function(done){
			server
			.post('/api/auth/login')
			.field('username', users[1].username)
			.field('password', 'password')
			.end(function(err, res){
				if(err) return done(err);
				authTokens[1] = res.body.token;
				return done();
			});
		});
		before(function(done){

			var token = speakeasy.totp({
				secret: users[2].two_factor_secret,
				encoding: 'base32',
			});

			server
			.post('/api/auth/login')
			.field('username', users[2].username)
			.field('password', 'password')
			.field('twoFactorToken', token)
			.end(function(err, res){
				if(err) return done(err);
				authTokens[2] = res.body.token;
				return done();
			});
		});

		secrets = [undefined, undefined, undefined]

		before(function(done){
			server
			.post('/api/auth/totp/generate')
			.set('Authorization', 'Bearer ' + authTokens[1])
			.end(function(err, res){
				if(err) return done(err);

				secrets[1] = res.body;

				return done();
			});
		})

		before(function(done){
			server
			.post('/api/auth/totp/generate')
			.set('Authorization', 'Bearer ' + authTokens[2])
			.end(function(err, res){
				if(err) return done(err);

				secrets[2] = res.body;

				return done();
			});
		})




		it('should return an error when no new secret is present in cache', function(done){
			// User1
			var secret = speakeasy.generateSecret();
			var token = speakeasy.totp({
				secret: secret.base32,
				encoding: 'base32'
			});

			server
			.post('/api/auth/totp/verify')
			.send(token)
			.set('Authorization', 'Bearer ' + authTokens[0])
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.message, 'Found no secret to verify');

				return done();
			});
		});


		it('it should fail when a user tries to verify with invalid token', function(done){
			// User2
			var token = speakeasy.totp({
				secret: secrets[1],
				encoding: 'base32',
				time: 0 // specified in seconds
			});
			server
			.post('/api/auth/totp/verify')
			.send(token)
			.set('Authorization', 'Bearer ' + authTokens[1])
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.message, 'Invalid token');

				return done();
			});
		});

		it('should succeed when a user verifies secret and should propegate to DB', function(){
			// User2
			var token = speakeasy.totp({
				secret: secrets[1],
				encoding: 'base32',
			});

			server
			.post('/api/auth/totp/verify')
			.send(token)
			.set('Authorization', 'Bearer ' + authTokens[1])
			.expect(200)
			.end(function(err, res){
				if(err) return err;

				assert.equal(res.body.message, 'OK');

				return knex('users')
				.select()
				.where('username', users[1].username)
				.then(function(rows){
					assert.equal(rows[0].two_factor_secret,  secrets[1]);
				});
				
			});

		});

		it('when a user has a secret in the db, it is replaced when verifying', function(){
			// User3
			var token = speakeasy.totp({
				secret: users[2].two_factor_secret,
				encoding: 'base32',
			});

			server
			.post('/api/auth/totp/verify')
			.send(token)
			.set('Authorization', 'Bearer ' + authTokens[2])
			.expect(200)
			.end(function(err, res){
				if(err) return err;

				assert.equal(res.body.message, 'OK');

				return knex('users')
				.select()
				.where('username', users[2].username)
				.then(function(rows){
					assert.notEqual(rows[0].two_factor_secret, users[2].two_factor_secret);
					assert.equal(rows[0].two_factor_secret,  secrets[2]);
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
			.where('username',  	users[0].username)
			.orWhere('username', 	users[1].username)
			.orWhere('username', 	users[2].username)
			.del()
			.then();
		})
	});

});
