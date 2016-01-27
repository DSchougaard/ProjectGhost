process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 	= require('assert');
var request = require('supertest');  
var should 	= require('should');
var sinon 	= require('sinon');



var fs 		= require('fs');
var base64 	= require(__base + 'helpers/base64.js');
var jwt 	= require('jsonwebtoken');
var moment 	= require('moment');

// SuperTest Connection
var server 	= request(require(__base + 'app.js').server);

// Test user
var testUser = {
	id: 					1,
	username: 				'User1',
	password: 				'password',
	privatekey_raw: 		fs.readFileSync(__base + 'misc/unittest-private.key'),
	privatekey: 			fs.readFileSync(__base + 'misc/unittest-private.key').toString('utf8'),
	publickey: 				fs.readFileSync(__base + 'misc/unittest-public.crt').toString('utf8'),
	
};
testUser.base64 = {
							publickey: base64.encode(testUser.publickey)
}

// Private and Public Key for Signing JWTs
const privateKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.key');
const publicKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.crt');


describe('Authentication', function(){
	describe('AuthToken', function(){
		it('returns an auth token for a user that exists', function(done){
			server
			.post('/api/auth/login')
			.field('username', testUser.username)
			.field('password', testUser.password)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				var token = res.body.token;

				jwt.verify(token, publicKey, function(err, decoded){
					if(err) done(err);

					(decoded).should.have.property('uid',1);
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
			.field('username', testUser.username)
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
			.field('password', testUser.password)
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
			.field('password', testUser.password)
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
			.field('username', testUser.username)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				(res.body.message).should.equal('Incomplete request: Missing password');
				(res.body.code).should.equal('BadRequestError');
				done();
			});
		});
	});
	
	describe('Access to restricted areas', function(){

		it('should grant access when a valid token is supplied', function(done){
			// Obtain valid token
			server
			.post('/api/auth/login')
			.field('username', testUser.username)
			.field('password', testUser.password)
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
				uid: testUser.id,
				iat: moment().unix(),
				exp: moment().add(14, 'days').unix()
			};
			var badToken = jwt.sign(payload, testUser.privatekey_raw, {algorithm: 'RS256'});

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
				uid: testUser.id,
				iat: 0,
				exp: 20000
			};

			//var badToken = jwt.sign(payload, privateKey, {algorithm: 'RS256'});
			var badToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOjEsImlhdCI6MTQ1Mjg2NTI4MSwiZXhwIjoyMDAwMH0.HUFZrEVRcICjfmPhRY-s2IZ6daRiGvZzr3_9MkuAmeU2AxhMYBPSvuGth81T7ELluBlXGp0fjuuKHTB-j2geKlI0R9X7gZ98ftE1oRmWadmLNsQy-Mvw9R0_MoLuBj7BOJzXGBjLVCtg0IQV9rKJOYdVe5dXo0z0BLMSoIJ3R2PkCrWUMmcePSvJq_aCORirPf4qQRX6CrTxUdauaNJ-FBFrLjkq5z9qatwOkE4H1lVZGeVxBbUwWudxAObh3YMR5eTX7pxUPI5EZQHYVIqKa3Vl7UKJAMHs-IL62PGYKKWcDeXhr1yMD-bOwRgLKOeD4q-8KPdyN46vMWSPs4Xnb72a6Orq6y9ngOFdDifTEPeYaUjQWU67Jy3YbdRs86O7LuT9E3Vv8aIHswVBiBiqqPiTt3MaxDlwkuCw-iXFwoB6pBFgnzJlGnyMRuY3mto4_g-i2MuPZ5_6V4jJT7m_iYpw0djbTkupdFHKpB96IxHgNhdQe9hTnvCBRzc_WvZW15Aty-8MD3-yeHDU-WTWF2lvs5lm50BTlMGroC4Sx3LGVBmVqQMmAhcj84uKsZT9mCKbLaKOsmprtr8fPsl8RcgbEipd3zYKT8v4bL4uDpZUufHeDx1VRBHCPqkWdPE0tsbjs78_RSzm7vtIg5BWetJ0VbcfdahpdceZwOi-_sY';

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
	});

});
