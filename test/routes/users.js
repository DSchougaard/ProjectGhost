process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var should 				= require('should');
var sinon 				= require('sinon');

var fs 					= require('fs');
var fse 				= require('fs-extra');
var rsa 				= require('node-rsa');
var _					= require('underscore');
var crypto 				= require('crypto');
var bcrypt 				= require('bcrypt');

var base64 				= require(__base + 'helpers/base64.js');
var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);

//var server = request.agent('https://localhost:8080');
const unittestData 		= require(__base + 'misc/unitTestData.js');
// Test user
var testUser = {
	username: 				'User3',
	password: 				'password',
	privatekey: 			fs.readFileSync('misc/unittest-private.key').toString('utf8'),
	publickey: 				fs.readFileSync('misc/unittest-public.crt').toString('utf8'),
};
testUser.base64 = {
		publickey: base64.encode(testUser.publickey),
		privatekey: base64.encode(testUser.privatekey)
}
//var IV = encrypt.generateIV();
//var ciphertext = encrypt.encrypt()


describe('API /users', function(){

	var authToken = '';

	before(function(done){
		// Obtain auth token
		server
		.post('/api/auth/login')
		.field('username', 'User1')
		.field('password', 'password')
		.expect(200)
		.end(function(err, res){
			if(err) return done(err);
			authToken = res.body.token;
			return done();
		});
	});

	describe("GET", function(){

		it.skip("Timeout without https", function(done){
			var wrongServer = request.agent("http://localhost:8080");
			wrongServer
			.set('Authorization', 'Bearer ' + authToken)
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
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body.length, 2);
				
				var filteredData = _.map(unittestData.userData, function(o) { return _.omit(o, 'privatekey', 'salt', 'password', 'isAdmin'); });	
				var usersWithoutIDs = _.map(res.body, function(o) { return _.omit(o, 'id'); });
				
				assert.deepEqual(usersWithoutIDs, filteredData);
				done();
			})
		});

		it.skip('should gracefully handle an internal DAL error', function(done){
			server
			.get('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(500)
			.end(function(err, res){
				err.should.equal("Internal database error");
				done();
			})
		})
	});
});

describe("API /user", function(){

	var authToken = '';

	before(function(done){
		// Obtain auth token
		server
		.post('/api/auth/login')
		.field('username', 'User1')
		.field('password', 'password')
		.expect(200)
		.end(function(err, res){
			if(err) return done(err);
			authToken = res.body.token;
			return done();
		});
	});

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
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('privatekey', testUser.base64.privatekey)
			.field('publickey', testUser.base64.publickey)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'password');
				assert.equal(res.body.errors[0].error, 'is required');
				done();
			});
		});

		it('should fail when a username is not supplied', function(done){
			server
			.post('/api/user')
			.set('Authorization', 'Bearer ' + authToken)
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.field('publickey', testUser.base64.publickey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'username');
				assert.equal(res.body.errors[0].error, 'is required');
				done();
			});
		});

		it('should fail when a private key is not supplied', function(done){
			server
			.post('/api/user')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('publickey', testUser.base64.publickey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'privatekey');
				assert.equal(res.body.errors[0].error, 'is required');
				done();
			});
		});

		it('should fail when a public key is not supplied', function(done){
			server
			.post('/api/user')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'publickey');
				assert.equal(res.body.errors[0].error, 'is required');
				done();
			});
		});

		it("Should fail at creating a user that already exists", function(done){
			server
			.post('/api/user')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', 'User1')
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.field('publickey', testUser.base64.publickey)
			.expect(400)
			.end(function(err, res){
				if(err){
					return done(err);	
				} 
				
				assert.equal(res.body, 'Username already exists');
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
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.field('publickey', testUser.base64.publickey)
			.expect(200)
			.end(function(err,res){
				if(err){
					return done(err);
				}
				
				var returnedID = parseInt(res.body.id);
				
				assert.notEqual(returnedID, NaN);
				testUser.id = returnedID;
				assert.equal(res.body.message, 'OK');

				var newDB = fs.readFileSync('./unittest.sqlite');
				var newChecksum = crypto.createHash('sha1').update(newDB).digest('hex');

				newChecksum.should.not.equal(originalChecksum);
				return done();
			});
		});

		it("Get all users should now return one more user", function(done) {
			server
			.get('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err,res){
				if(err) return done(err);
				
				assert.equal(res.body.length, 3);
				var usersWithoutIDs = _.map(res.body, function(o) { return _.omit(o, 'id'); });
				
				var expectedInsertedUser = {
					username: testUser.username,
					publickey: testUser.base64.publickey
				}
				
				var filteredData = _.map(unittestData.userData, function(o) { return _.omit(o, 'privatekey', 'salt', 'password', 'isAdmin'); });	
				filteredData.push(expectedInsertedUser);
					
			
				assert.deepEqual(usersWithoutIDs, filteredData);
					
				done();
			});
		});
	});
	
	describe("DELETE: Delete a user", function(){

		it('should fail on deleting non-existant user', function(done){
			server
			.del('/api/user/'+1337)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err,res){
				if(err){
					return done(err);
				} 
				
				assert.equal(res.body, 'User ID 1337 was not found');
				
				return done();
			});

		});
		
		it('should fail when passed id is of the wrong type', function(done){
			server
			.del('/api/user/true')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'id');
				assert.equal(res.body.errors[0].error, 'is the wrong type');
				return done();
			})
		})

		it('should fail when no auth token is passed', function(done){
			server
			.del('/api/user/'+testUser.id)
			.expect(401)
			.end(function(err,res){
				if(err) return done(err);

				(res.body.code).should.equal('UnauthorizedError');
				(res.body.message).should.equal('No Authorization header was found');

				return done();
			});
		});
		
		it('should successfully delete a user', function(done){
			server
			.del('/api/user/'+testUser.id)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err,res){
				if(err){
					return done(err);
				} 
				
				assert.equal(res.body, 'OK');
				
				return done();
			});
		});

		it('should return one less user', function(done){
			server
			.get('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				(res.body).should.have.length(2);
				
				var usersWithoutIDs = _.map(res.body, function(o) { return _.omit(o, 'id'); });
				var filteredData = _.map(unittestData.userData, function(o) { return _.omit(o, 'privatekey', 'salt', 'password', 'isAdmin'); });	
				
				assert.deepEqual(usersWithoutIDs, filteredData);
				return done();
			});
		});

	});


	describe('PUT: Updating a user', function(){

	});

	describe('GET: Get a single user', function(){
		
		it('should succeed in getting a user', function(done){
			var id = 1;
			server
			.get('/api/user/' + id)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body.username, unittestData.userData[0].username);
				assert.equal(res.body.publickey, unittestData.userData[0].publickey);
				assert.equal(res.body.id, id);
				return done();
			});
		});
		
		it('should fail at getting non-existant user', function(done){
			var id = 1337;
			server
			.get('/api/user/' + id)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(404)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body, 'User with ID ' + id + ' was not found');
				return done();
			});
		});
		
		it('should fail when no id is passed', function(done){
			server
			.get('/api/user/')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'id');
				assert.equal(res.body.errors[0].error, 'is the wrong type');
				return done();
			});
		});
		
		it('should fail when a id of wrong type is passed', function(done){
			server
			.get('/api/user/true')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'id');
				assert.equal(res.body.errors[0].error, 'is the wrong type');
				return done();
			});
		});


	});

	describe('GET: Get users public cert', function(){

	});
});