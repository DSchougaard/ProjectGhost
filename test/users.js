process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert = require('assert');
var request = require('supertest');  
var should = require('should');


var fs = require('fs');
var fse = require('fs-extra');
var rsa = require('node-rsa');

var crypto = require('crypto');


//var app = require("../app").getServer;

//var agent = request.agent(server);
var server = request.agent("https://localhost:8080");


// Test user
var testUser = {
	username: 'User3',
	password: 'password',
	privateKey: fs.readFileSync('test/unittest-test.key').toString('utf8'),
	publicKey: fs.readFileSync('test/unittest-test.crt').toString('utf8')
};


describe('API /users', function(){
	describe("GET", function(){

		it("Timeout without https", function(done){
			var wrongServer = request.agent("http://localhost:8080");
			wrongServer
			.get("/api/users")
			.end(function(err,res){
				assert.equal(err, "Error: socket hang up");
				done();
			});
		});

		it("Get contents of unittest.sqlite", function(done){

			var contents = [{"username": "User1", 'publickey': testUser.publicKey},{"username": "User2", 'publickey': testUser.publicKey}];
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
	});
});

describe("API /user/", function(){
	describe("POST: Create a new user", function(){

		/*
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
		*/

		it('should fail when a password is not supplied', function(done){
			server
			.post('/api/user')
			.field('username', testUser.username)
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
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
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
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
			.field('publickey', testUser.publicKey)
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
			.field('privatekey', testUser.privateKey)
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
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
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
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
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
			})
		});

		it("Get all users should now return one more user", function(done) {
			server
			.get('/api/users')
			.expect(200)
			.end(function(err,res){
				if(err) return done(err);
				(res.body).should.have.length(3);
				//(res.body).should.deepEqual([{'username':'User1'},{'username':'User2'},{'username':'User3'}]);
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
			})
		})
		it('should successfully delete a user', function(done){
			server
			.del('/api/user')
			.field('username', 'User3')
			.expect(200)
			.end(function(err,res){
				if(err) return done(err);
				done();
			})
		});

		it('should return one less user', function(done){
			server
			.get('/api/users')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				(res.body).should.have.length(2);
				//(res.body).should.deepEqual( [{'username':'User1', 'publickey': testUser.publicKey}, {'username':'User2', 'publickey': testUser.publicKey}] );
				done();
			})
		});
	})
	
});
