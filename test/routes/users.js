process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var should 				= require('should');
var sinon 				= require('sinon');
const argon2 			= require('argon2');

var fs 					= require('fs');
var fse 				= require('fs-extra');
var _					= require('underscore');
var crypto 				= require('crypto');
var bcrypt 				= require('bcrypt');

var base64 				= require(__base + 'helpers/base64.js');
var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);

const certs 			= require(__base + 'test/certs.js');

// Test user
var testUser = {
	username: 				'User3',
	password: 				'password',
	isAdmin: 				false,
	publickey: 				certs.publicKey.raw,
	privatekey: 			certs.privateKey.raw,
	pk_salt: 				"Gvfqk3Dp/ezVweCxJ1BZgDADKWHDQGhy7tyEU5p+p3kZ9N8eWcPTEfLXqplZA5WVqMbLB3slU47jPXnj4krRDywT6CnK096wWP7Mc3khwlaRFLyjnf0u3TD9hs0udc194JwYXq0fAuzvM36iKlpXeGFDBVtP4NZV/7OIJX1LBkI=",
	iv:  					base64.encode('111111111')
};
testUser.base64 = {
		publickey: certs.publicKey.base64,
		privatekey: certs.privateKey.base64
}
//var IV = encrypt.generateIV();
//var ciphertext = encrypt.encrypt()

var knex = require(__base + 'database.js');

describe('API /users', function(){

	function generateTemplateUser(username){
		return {
			username 	: 'Api#Users#' + username,
			salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
			password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
			privatekey 	: 'cGFzc3dvcmQ=',
			iv 			: 'cGFzc3dvcmQ=',
			pk_salt 	: 'cGFzc3dvcmQ=',
			publickey 	: 'cGFzc3dvcmQ='
		};
	}

	var users = [
		generateTemplateUser('GET-User001'),
		generateTemplateUser('GET-User002'),
		generateTemplateUser('GET-User003'),
	];

	before(function(){
		return knex('users')
		.insert(users)
		.then(function(){
			return knex('users')
			.select();
		})
		.then(function(_users){
			users = _users;
		});
	})

	var authToken = '';

	before(function(done){
		// Obtain auth token
		server
		.post('/api/auth/login')
		.field('username', users[0].username)
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
				assert.equal(res.body.length, users.length);


				assert.deepEqual(res.body, _.map(users, function(o) { return _.pick(o, 'id', 'isAdmin', 'publickey', 'username'); }) );

				//var usersWithoutIDs = _.map(res.body, function(o) { return _.omit(o, 'id'); });
				
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

	after(function(){
		return knex('audit')
		.del()
		.then();
	});
	after(function(){
		return knex('users')
		.del()
		.then();
	});
});

describe("API /user", function(){
	function generateTemplateUser(username){
		return {
			username 	: 'Api#User#' + username,
			salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
			password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
			privatekey 	: 'cGFzc3dvcmQ=',
			iv 			: 'cGFzc3dvcmQ=',
			pk_salt 	: 'cGFzc3dvcmQ=',
			publickey 	: 'cGFzc3dvcmQ='
		};
	}


	describe("POST: Create a new user", function(){

		var authToken = '';
		var otherAuthToken = '';

		var users = [
			generateTemplateUser('User001-Admin'),
			generateTemplateUser('User002-User'),
		]
		users[0].isAdmin = true;
		users[1].isAdmin = false;

		before(function(){
			return knex('users')
			.insert(users)
			.then(function(){
				return knex('users').select();
			})
			.then(function(_users){
				users = _users;
			});
		});


		before(function(done){
			// Obtain auth token
			server
			.post('/api/auth/login')
			.field('username', users[0].username)
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
			.field('username', users[1].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				otherAuthToken = res.body.token;
				return done();
			});
		});
	
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

			var t = _.omit(generateTemplateUser('User001-Admin'), 'password', 'salt');
			t.password = 'password';

			server
			.post('/api/users')
			.set('Authorization', 'Bearer ' + authToken)
			.send(t)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body.code, 'BadRequestError');
				assert.equal(res.body.message, 'Username already exists');
				return done();
			});
		});

		it("Successfully inserts a user", function(done){
			var newUser = _.omit(generateTemplateUser('User003'), 'salt', 'password');
			newUser.password = 'password';

			// Insert user
			server
			.post('/api/users')
			.send(newUser)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err,res){
				if(err){
					return done(err);
				}
				
				var returnedID = parseInt(res.body.id);
				
				assert.notEqual(returnedID, NaN);
				assert.equal(res.body.message, 'OK');

				newUser.id = returnedID;
				newUser.isAdmin = 0; // Hacky
				users.push(newUser);

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
				
				assert.deepEqual(res.body, _.map(users, function(o) { return _.pick(o, 'id', 'isAdmin', 'publickey', 'username'); }) );
					
				done();
			});
		});

		//after(function(){
		//	return knex('audit')
		//	.del()
		//	.then();
		//});
//
//
//		//after(function(){
//		//	return knex('users')
//		//	.del()
//		//	.then();
		//});
	});
	

	describe('PUT: Updating a user', function(){


		var users = [
			generateTemplateUser('PUT-User001'),
			generateTemplateUser('PUT-User002'),
			generateTemplateUser('PUT-User003'),
		]

		before(function(){
			return knex('users')
			.insert(users)
			.then(function(){
				return knex('users').select();
			})
			.then(function(_users){
				users = _users;
			});
		});

		var tokens = [ undefined, undefined, undefined ];

		before(function(done){
			// Obtain auth token
			server
			.post('/api/auth/login')
			.field('username', users[0].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[0] = res.body.token;
				return done();
			});
		});
		before(function(done){
			// Obtain auth token
			server
			.post('/api/auth/login')
			.field('username', users[1].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[1] = res.body.token;
				return done();
			});
		});
		before(function(done){
			// Obtain auth token
			server
			.post('/api/auth/login')
			.field('username', users[2].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[2] = res.body.token;
				return done();
			});
		});

		it('successfully updates a single field, non-password', function(done){
			server
			.put('/api/users/' + users[0].id)
			.set('Authorization', 'Bearer ' + tokens[0])
			.field('username', 'Kylo Ren')
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
			.where('id', users[0].id)
			.then(function(user){
				assert.equal(user.length, 			1);

				assert.equal(user[0].username,		'Kylo Ren');

				assert.equal(user[0].id, 			users[0].id);
				assert.equal(user[0].privatekey, 	users[0].privatekey)
				assert.equal(user[0].publickey, 	users[0].publickey)
				assert.equal(user[0].isAdmin, 		1);	
			});
		});

		it('successfully updates password and generates new salt', function(done){
			server
			.put('/api/users/' + users[1].id)
			.set('Authorization', 'Bearer ' + tokens[1])
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
			.where('id', users[1].id)
			.then(function(user){
				assert.equal(user.length, 1);

				assert.equal(argon2.verifySync(user[0].password, 'totallysecure'), true);

				assert.equal(user[0].username, 		users[1].username);
				assert.equal(user[0].id, 			users[1].id);
				assert.equal(user[0].privatekey, 	users[1].privatekey)
				assert.equal(user[0].publickey, 	users[1].publickey)
				assert.equal(user[0].isAdmin, 		false);	
			});
		});

		it('fails when trying to update id', function(done){
			server
			.put('/api/users/' + users[2].id)
			.set('Authorization', 'Bearer ' + tokens[2])
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
			.put('/api/users/' + users[2].id)
			.set('Authorization', 'Bearer ' + tokens[2])
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
			.put('/api/users/' + users[2].id)
			.set('Authorization', 'Bearer ' + tokens[2])
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
			.set('Authorization', 'Bearer ' + tokens[2])
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
		after(function(){
			return knex('users')
			.del()
			.then();
		});
	});


	describe("DELETE: Delete a user", function(){

		{
			var users = [
				generateTemplateUser('DELETE-User001'),
				generateTemplateUser('DELETE-User002'),
				generateTemplateUser('DELETE-User003'),
			]

			before(function(){
				return knex('users')
				.insert(users)
				.then(function(){
					return knex('users').select();
				})
				.then(function(_users){
					users = _users;
				});
			});

			var tokens = [ undefined, undefined, undefined ];

			before(function(done){
				// Obtain auth token
				server
				.post('/api/auth/login')
				.field('username', users[0].username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					tokens[0] = res.body.token;
					return done();
				});
			});
			before(function(done){
				// Obtain auth token
				server
				.post('/api/auth/login')
				.field('username', users[1].username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					tokens[1] = res.body.token;
					return done();
				});
			});
			before(function(done){
				// Obtain auth token
				server
				.post('/api/auth/login')
				.field('username', users[2].username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					tokens[2] = res.body.token;
					return done();
				});
			});
		}

		it('should fail on deleting non-existant user', function(done){
			server
			.del('/api/users/'+1337)
			.set('Authorization', 'Bearer ' + tokens[0])
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
			.set('Authorization', 'Bearer ' + tokens[0])
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
			.del('/api/users/'+users[0].id)
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
			.del('/api/users/'+users[1].id)
			.set('Authorization', 'Bearer ' + tokens[1])
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
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				(res.body).should.have.length(2);

				var userRemoved = _.filter(users, function(u){
					return u.username !== generateTemplateUser('DELETE-User002').username;
				});
				
				assert.deepEqual(res.body, _.map(userRemoved, function(o) { return _.pick(o, 'id', 'isAdmin', 'publickey', 'username'); }) );

				return done();
			});
		});

		it('should not allow a user to delete another user', function(done){
			server
			.del('/api/users/'+users[0].id)
			.set('Authorization', 'Bearer ' + tokens[2])
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
	
		{
			var users = [
				generateTemplateUser('GET-User001'),
			]

			before(function(){
				return knex('users')
				.insert(users)
				.then(function(){
					return knex('users').select();
				})
				.then(function(_users){
					users = _users;
				});
			});

			var tokens = [ undefined ];

			before(function(done){
				// Obtain auth token
				server
				.post('/api/auth/login')
				.field('username', users[0].username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					tokens[0] = res.body.token;
					return done();
				});
			});
		}

		it('should succeed in getting a user', function(done){
			server
			.get('/api/users/' + users[0].id)
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(200)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body.username, 	users[0].username);
				assert.equal(res.body.publickey, 	users[0].publickey);
				assert.equal(res.body.id,			users[0].id);

				return done();
			});
		});
		
		it('should fail at getting non-existant user', function(done){
			server
			.get('/api/users/' + 1337)
			.set('Authorization', 'Bearer ' + tokens[0])
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
			.set('Authorization', 'Bearer ' + tokens[0])
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

		after(function(){
			return knex('users')
			.del()
			.then();
		});
	});
});