var assert 	= require('assert');
var request = require('supertest');  
var should 	= require('should');
var sinon 	= require('sinon');

var fs = require('fs');
var base64 = require('../helpers/base64.js');
const jwt 				= require('jsonwebtoken');

// SuperTest Connection
var restifyInstance = require('../app.js');
var server = request(restifyInstance.server);


// Test user
var testUser = {
	username: 				'User1',
	password: 				'password',
	privatekey: 			fs.readFileSync('test/unittest-test.key').toString('utf8'),
	publickey: 				fs.readFileSync('test/unittest-test.crt').toString('utf8'),
	
};
testUser.base64 = {
							publickey: base64.encode(testUser.publickey)
}

// Private and Public Key for Signing JWTs
const privateKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.key');
const publicKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.crt');


describe.only('Authentication', function(){
	var token = '';
	describe('AuthToken', function(){
		it('returns an auth token for a user that exists', function(done){
			server
			.post('/api/auth/login')
			.field('username', testUser.username)
			.field('password', testUser.password)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				token = res.body.token;

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
		it('should fail when no token is supplied', function(done){
			server
			.get('/api/auth/ping')
			.expect(407)
		})
	});

});
