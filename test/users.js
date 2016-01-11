process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert = require('assert');
var request = require('supertest');  
var should = require('should');


var fs = require('fs');
var fse = require('fs-extra')

var crypto = require('crypto');


//var app = require("../app").getServer;

//var agent = request.agent(server);
var server = request.agent("https://localhost:8080");


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

			var contents = [{"username": "User1"},{"username": "User2"}];
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
		it('should fail when a password is not supplied', function(done){
			server
			.post('/api/user')
			.field('username', 'User3')
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
			.field('password', 'password')
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				(res.body.message).should.equal('Incomplete request: Missing username');
				done();
			});
		});

		it("Should fail at creating a user that already exists", function(done){
			server
			.post('/api/user')
			.field('username', 'User1')
			.field('password', 'password')
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
			.field('username', 'User3')
			.field('password', 'password')
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
				if(err) return done();
				(res.body).should.have.length(3);
				(res.body).should.deepEqual([{'username':'User1'},{'username':'User2'},{'username':'User3'}]);
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
				if(err) return done();
				(res.body).should.have.length(2);
				(res.body).should.deepEqual([{'username':'User1'}, {'username':'User2'}]);
				done();
			})
		});
	})
	
});
