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
	isAdmin: 				false,
	privatekey: 			fs.readFileSync('misc/unittest-private.key').toString('utf8'),
	publickey: 				fs.readFileSync('misc/unittest-public.crt').toString('utf8'),
	pk_salt: 				"Gvfqk3Dp/ezVweCxJ1BZgDADKWHDQGhy7tyEU5p+p3kZ9N8eWcPTEfLXqplZA5WVqMbLB3slU47jPXnj4krRDywT6CnK096wWP7Mc3khwlaRFLyjnf0u3TD9hs0udc194JwYXq0fAuzvM36iKlpXeGFDBVtP4NZV/7OIJX1LBkI=",
	iv:  					base64.encode('111111111')
};
testUser.base64 = {
		publickey: base64.encode(testUser.publickey),
		privatekey: base64.encode(testUser.privatekey)
}
//var IV = encrypt.generateIV();
//var ciphertext = encrypt.encrypt()

var knex = require(__base + 'database.js');

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
			server
			.get('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body.length, 2);
				
				var filteredData = _.map(unittestData.userData, function(o) { return _.omit(o, 'iv', 'pk_salt', 'privatekey', 'salt', 'password'); });	
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
	var otherAuthToken = '';

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


	before(function(done){
		// Obtain auth token
		server
		.post('/api/auth/login')
		.field('username', 'User2')
		.field('password', 'password')
		.expect(200)
		.end(function(err, res){
			if(err) return done(err);
			otherAuthToken = res.body.token;
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
			.post('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('privatekey', testUser.base64.privatekey)
			.field('publickey', testUser.base64.publickey)
			.field('iv', testUser.iv)
			.field('pk_salt', testUser.pk_salt)
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
			.post('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.field('publickey', testUser.base64.publickey)
			.field('iv', testUser.iv)
			.field('pk_salt', testUser.pk_salt)
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
			.post('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('publickey', testUser.base64.publickey)
			.field('iv', testUser.iv)
			.field('pk_salt', testUser.pk_salt)
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
			.post('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.field('iv', testUser.iv)
			.field('pk_salt', testUser.pk_salt)
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

		it('should fail when a iv is not supplied', function(done){
			server
			.post('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.field('publickey', testUser.base64.publickey)
			.field('pk_salt', testUser.pk_salt)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'iv');
				assert.equal(res.body.errors[0].error, 'is required');
				done();
			});
		});

		it('should fail when pk_salt is not supplied', function(done){
			server
			.post('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.field('iv', testUser.iv)
			.field('publickey', testUser.base64.publickey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'pk_salt');
				assert.equal(res.body.errors[0].error, 'is required');
				done();
			});
		});

		it("Should fail at creating a user that already exists", function(done){
			server
			.post('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', 'User1')
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.field('publickey', testUser.base64.publickey)
			.field('iv', testUser.iv)
			.field('pk_salt', testUser.pk_salt)
			.expect(400)
			.end(function(err, res){
				if(err){
					return done(err);	
				} 
				
				assert.equal(res.body.code, 'BadRequestError');
				assert.equal(res.body.message, 'Username already exists');
				return done();
			});
		});

		it("Database file has should change after insert", function(done){
			// Create finger print before insert
			var originalDB = fs.readFileSync('./unittest.sqlite');
			var originalChecksum = crypto.createHash('sha1').update(originalDB).digest('hex');

			// Insert user
			server
			.post('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.base64.privatekey)
			.field('publickey', testUser.base64.publickey)
			.field('iv', testUser.iv)
			.field('pk_salt', testUser.pk_salt)
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
				var usersWithoutIDs = _.map(res.body, function(o) { o.isAdmin === 1 ? o.isAdmin = true : o.isAdmin = false; return _.omit(o, 'id'); });
				
				var expectedInsertedUser = {
					username: testUser.username,
					publickey: testUser.base64.publickey,
					isAdmin: false
				}
				
				var filteredData = _.map(unittestData.userData, function(o) { return _.omit(o, 'iv', 'pk_salt','privatekey', 'salt', 'password'); });	
				filteredData.push(expectedInsertedUser);

				assert.deepEqual(usersWithoutIDs, filteredData);
					
				done();
			});
		});

		after(function(){
			return knex('audit')
			.del()
			.then();
		});
	});
	

	describe('PUT: Updating a user', function(){

		var testUserToken = undefined;
		before(function(done){
			// Obtain auth token
			server
			.post('/api/auth/login')
			.field('username', testUser.username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				console.log("got token")
				testUserToken = res.body.token;
				return done();
			});
		});



		var testUpdatedUsername = 'NotAUnitTestUser';

		it('successfully updates a single field, non-password', function(done){
			server
			.put('/api/users/' + testUser.id)
			.set('Authorization', 'Bearer ' + testUserToken)
			.field('username', testUpdatedUsername)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body, 'OK');
				return done();
			});
		});

		it('should have updated the database entry, after the previous test', function(){
			return knex('users')
			.select()
			.where('username', testUpdatedUsername)
			.then(function(user){
				assert.equal(user.length, 1);

				assert.equal(user[0].username,		testUpdatedUsername);

				assert.equal(user[0].id, 			testUser.id);
				assert.equal(user[0].privatekey, 	testUser.base64.privatekey)
				assert.equal(user[0].publickey, 	testUser.base64.publickey)
				assert.equal(user[0].isAdmin, 		false);	
			});
		});

		it('successfully updates password and generates new salt', function(done){
			server
			.put('/api/users/' + testUser.id)
			.set('Authorization', 'Bearer ' + testUserToken)
			.field('password', 'totallysecure')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body, 'OK');
				return done();
			});
		});

		it('should have updated the database entry, after the previous test', function(){
			return knex('users')
			.select()
			.where('username', testUpdatedUsername)
			.then(function(user){
				assert.equal(user.length, 1);

				var expectedPassword = bcrypt.hashSync('totallysecure', user[0].salt);
				assert.equal(user[0].password, expectedPassword);

				assert.equal(user[0].username, 		testUpdatedUsername);
				assert.equal(user[0].id, 			testUser.id);
				assert.equal(user[0].privatekey, 	testUser.base64.privatekey)
				assert.equal(user[0].publickey, 	testUser.base64.publickey)
				assert.equal(user[0].isAdmin, 		false);	
			});
		});

		it('fails when trying to update id', function(done){
			server
			.put('/api/users/' + testUser.id)
			.set('Authorization', 'Bearer ' + testUserToken)
			.field('id', 1337)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'data');
				assert.equal(res.body.errors[0].error, 'has additional properties')
				return done();
			});
		});

		it('fails when payload has invalid values', function(done){
			server
			.put('/api/users/' + testUser.id)
			.set('Authorization', 'Bearer ' + testUserToken)
			.field('privatekey', 'this is not base64')
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'privatekey');
				assert.equal(res.body.errors[0].error, 'pattern mismatch');

				return done();
			});
		});

		it('fails when payload is empty', function(done){
			server
			.put('/api/users/' + testUser.id)
			.set('Authorization', 'Bearer ' + testUserToken)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);
				
				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'data');
				assert.equal(res.body.errors[0].error, 'is required');

				return done();
			});
		});

		it('fails when updating non-existant user', function(done){
			server
			.put('/api/users/' + 1337)
			.set('Authorization', 'Bearer ' + testUserToken)
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'User was not found');

				return done();
			});
		});

		after(function(){
			return knex('audit')
			.del()
			.then();
		});
	});


	describe("DELETE: Delete a user", function(){

		it('should fail on deleting non-existant user', function(done){
			server
			.del('/api/users/'+1337)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(404)
			.end(function(err,res){
				if(err){
					return done(err);
				} 
				
				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'User was not found');
				
				return done();
			});
		});
		
		it('should fail when passed id is of the wrong type', function(done){
			server
			.del('/api/users/true')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'BadRequestError');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'id');
				assert.equal(res.body.errors[0].error, 'is the wrong type');

				return done();
			});
		});

		it('should fail when no auth token is passed', function(done){
			server
			.del('/api/users/'+testUser.id)
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
			.del('/api/users/'+testUser.id)
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
				var filteredData = _.map(unittestData.userData, function(o) { return _.omit(o, 'iv', 'pk_salt', 'privatekey', 'salt', 'password'); });	
				
				assert.deepEqual(usersWithoutIDs, filteredData);
				return done();
			});
		});

		it('should not allow a user to delete another user', function(done){
			server
			.del('/api/users/'+1)
			.set('Authorization', 'Bearer ' + otherAuthToken)
			.expect(403)
			.end(function(err,res){
				if(err){
					return done(err);
				} 
				

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');
				
				return done();
			});
		});

		after(function(){
			return knex('audit')
			.del()
			.then();
		});
	});


	describe('GET: Get a single user', function(){
		
		it('should succeed in getting a user', function(done){
			var id = 1;
			server
			.get('/api/users/' + id)
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
			.get('/api/users/' + id)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(404)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'User was not found');

				return done();
			});
		});
		
		it('should fail when a id of wrong type is passed', function(done){
			server
			.get('/api/users/true')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body.code, 'BadRequestError');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'id');
				assert.equal(res.body.errors[0].error, 'is the wrong type');
				
				return done();
			});
		});

		it.skip('should fail when trying to get another user\'s data', function(done){
			server
			.get('/api/users/' + 1)
			.set('Authorization', 'Bearer ' + otherAuthToken)
			.field('username', 'SomethingSilly')
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);
			
				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});
		
		after(function(){
			return knex('audit')
			.del()
			.then();
		});
	});
});