process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
global.__base 		= __dirname + '/';

var assert = require('assert');
var request = require('supertest');  
var should = require('should');
var sinon = require('sinon');

var fs = require('fs');
var fse = require('fs-extra');
var rsa = require('node-rsa');

var crypto = require('crypto');

var base64 = require('../helpers/base64.js');
var restifyInstance = require('../app.js');
var server = request(restifyInstance.server);

// Test user
var testUser = {
	username: 				'User3',
	password: 				'password',
	privatekey: 			fs.readFileSync('test/unittest-test.key').toString('utf8'),
	publickey: 				fs.readFileSync('test/unittest-test.crt').toString('utf8'),

};
testUser.base64 = {
		publickey: base64.encode(testUser.publickey)
}
//var IV = encrypt.generateIV();
//var ciphertext = encrypt.encrypt()

describe('API /users', function(){
	describe("GET", function(){

		it.skip("Timeout without https", function(done){
			var wrongServer = request.agent("http://localhost:8080");
			wrongServer
			.get("/api/users")
			.end(function(err,res){
				assert.equal(err, "Error: socket hang up");
				done();
			});
		});

		it("Get contents of unittest.sqlite", function(done){

			var contents = [{"username": "User1", 'publickey': testUser.base64.publickey},{"username": "User2", 'publickey': testUser.base64.publickey}];
			//request(server)
			server
			.get('/api/users')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				(res.body).should.have.length(2);
				(res.body).should.deepEqual(contents);
				done();
			})
		});

		it.skip('should gracefully handle an internal DAL error', function(done){
			server
			.get('/api/users')
			.expect(500)
			.end(function(err, res){
				err.should.equal("Internal database error");
				done();
			})
		})
	});
});

describe("API /user/", function(){
	describe("POST: Create a new user", function(){

		/*
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.privatekey)
			.field('publickey', testUser.publickey)
		*/

		it('should fail when a password is not supplied', function(done){
			server
			.post('/api/user')
			.field('username', testUser.username)
			.field('privatekey', testUser.privatekey)
			.field('publickey', testUser.base64.publickey)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);
				(res.body.message).should.equal('Incomplete request: Missing password');
				done();
			});
		});

		it('should fail when a username is not supplied', function(done){
			server
			.post('/api/user')
			.field('password', testUser.password)
			.field('privatekey', testUser.privatekey)
			.field('publickey', testUser.base64.publickey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				(res.body.message).should.equal('Incomplete request: Missing username');
				done();
			});
		});

		it('should fail when a private key is not supplied', function(done){
			server
			.post('/api/user')
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('publickey', testUser.base64.publickey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				(res.body.message).should.equal('Incomplete request: Missing private key');
				done();
			});
		});

		it('should fail when a public key is not supplied', function(done){
			server
			.post('/api/user')
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.privatekey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				(res.body.message).should.equal('Incomplete request: Missing public key');
				done();
			});
		});

		it("Should fail at creating a user that already exists", function(done){
			server
			.post('/api/user')
			.field('username', 'User1')
			.field('password', testUser.password)
			.field('privatekey', testUser.privatekey)
			.field('publickey', testUser.base64.publickey)
			.expect(400)
			.end(function(err, res){
				if(err){
					return done(err);	
				} 
				(res.body).should.equal("Username already exists.");
				return done();
			});
		});

		it("Database file has should change after insert", function(done){
			// Create finger print before insert
			var originalDB = fs.readFileSync('./unittest.sqlite');
			var originalChecksum = crypto.createHash('sha1').update(originalDB).digest('hex');

			// Insert user
			server
			.post('/api/user')
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.privatekey)
			.field('publickey', testUser.base64.publickey)
			.expect(200)
			.end(function(err,res){
				if(err){
					return done(err);
				}
				(res.body).should.equal("OK");

				var newDB = fs.readFileSync('./unittest.sqlite');
				var newChecksum = crypto.createHash('sha1').update(newDB).digest('hex');

				newChecksum.should.not.equal(originalChecksum);
				return done();
			});
		});

		it("Get all users should now return one more user", function(done) {
			server
			.get('/api/users')
			.expect(200)
			.end(function(err,res){
				if(err) return done(err);
				(res.body).should.have.length(3);
				(res.body).should.deepEqual([{'username':'User1', 'publickey': testUser.base64.publickey},{'username':'User2', 'publickey': testUser.base64.publickey},{'username':'User3', 'publickey': testUser.base64.publickey}]);
				done();
			});
		});
	})
	
	describe("DELETE: Delete a user", function(){
		it('should fail on deleting non-existant user', function(done){
			server
			.del('/api/user')
			.field('username', 'DoesNotExist')
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				done();
			});
		})
		it('should successfully delete a user', function(done){
			server
			.del('/api/user')
			.field('username', 'User3')
			.expect(200)
			.end(function(err,res){
				if(err) return done(err);
				done();
			});
		});

		it('should return one less user', function(done){
			server
			.get('/api/users')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				(res.body).should.have.length(2);
				(res.body).should.deepEqual( [{'username':'User1', 'publickey': testUser.base64.publickey}, {'username':'User2', 'publickey': testUser.base64.publickey}] );
				done();
			});
		});
	})
	
});
