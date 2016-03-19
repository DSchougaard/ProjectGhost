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

var knex = require(__base + 'database.js');



describe("API /password", function(){

	var authToken = '';
	var idAuthToken = '1';

	var otherAuthToken = '';
	var idOtherAuthToken = '2';

	before(function(done){
		// Obtain auth token -- admin
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
		// Obtain auth token -- admin
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

	var validPassword = {
		parent: 1,
		title: 'Death Star Back Entrance',
		username: 'Obi Wan Kenobi',
		password: base64.encode('IMissQuiGonJinn'),
		note: 'Darth Maul is a meanie!'
	};

	describe('GET/id', function(){

		var testID = 1;

		var users = [
			{
				//username: 'Routes/Passwords/GET/id-User1',
				username: 'Routes#Passwords#GET#id-User1',
				isAdmin: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			}
		];


		var passwords = [
			{
				parent 		: null,
				//title 		: 'Routes/Passwords/GET/id-User1-Password01',
				//username 	: 'Routes/Passwords/GET/id-User1-Password01-User',
				title 		: 'Routes#Passwords#GET#id-User1-Password01',
				username 	: 'Routes#Passwords#GET#id-User1-Password01-User',

				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		]

		before(function(){
			return knex('users')
			.insert(users[0])
			.then(function(ids){
				users[0].id = ids[0];
				passwords[0].owner = users[0].id;
				return knex('passwords').insert(passwords[0]);
			})
			.then(function(ids){
				passwords[0].id = ids[0];
			});
		})


		it('should successfully get a password', function(){
			server
			.get('/api/users/'+idAuthToken+'/passwords/' + testID)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);


				return knex('passwords')
				.select()
				.where('id', testID)
				.then(function(passwords){
					assert.equal(res.body.owner, 	passwords[0].owner);
					assert.equal(res.body.parent, 	passwords[0].parent);
					assert.equal(res.body.title, 	passwords[0].title);
					assert.equal(res.body.username, passwords[0].username);
					assert.equal(res.body.password, passwords[0].password);
					assert.equal(res.body.iv, 		passwords[0].iv);
					assert.equal(res.body.note, 	passwords[0].note);
				});
			})
		});

		it('should fail when trying to get a password, for a user that does not exist', function(done){
			server
			.get('/api/users/' + 1337 + '/passwords/' + testID)
			.set('Authorization', 'Bearer ' + authToken)	
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'User was not found');

				return done();
			});		
		})

		it('should fail trying to get a password that does not exist', function(done){
			server
			.get('/api/users/'+idAuthToken+'/passwords/1337')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'Password was not found');

				return done();
			});
		});

		it('should fail trying to get a password when input is malformed', function(done){
			server
			.get('/api/users/'+idAuthToken+'/passwords/true')
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

		it('should fail when trying to get another user\'s password', function(done){
			server
			.get('/api/users/'+idAuthToken+'/passwords/' + passwords[0].id)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});

		it('should fail when no auth token is supplied', function(done){
			server
			.get('/api/users/' + idAuthToken + '/passwords')
			.expect(401)
			.end(function(err, res){
				assert.equal(res.body.code, 'UnauthorizedError');
				assert.equal(res.body.message, 'No Authorization header was found');

				return done();
			})
		});

		
		after(function(){
			return knex('passwords')
			.where('id', passwords[0].id)
			//.orWhere('id', passwords[1].id)
			.del()
			.then(function(){
				return knex('users')
				.where('id', users[0].id)
				//.orWhere('id', users[1].id)
				.del();
			})
			.then(function(){

			});
		})

	});

	describe('GET', function(){

		var users = [
			{
				username: 'Routes#Passwords#get-User001',
				salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
				password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
				isAdmin: false,
				privatekey: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ='
			},
			{
				username: 'Routes#Passwords#get-User002',
				salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
				password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
				isAdmin: true,
				privatekey: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ='
			}
		];

		var passwords = [
			{
				parent 		: null,
				owner 		: undefined,
				title 		: 'Routes#Passwords#get-Title001',
				username 	: 'Routes#Passwords#get-User001',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'Nah, bruh..',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: undefined,
				title 		: 'Routes#Passwords#get-Title002',
				username 	: 'Routes#Passwords#get-User002',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'Nah, bruh..',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: undefined,
				title 		: 'Routes#Passwords#get-Title003',
				username 	: 'Routes#Passwords#get-User003',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'Nah, bruh..',
				url 		: null
			}
		]

		var tokens = [];

		before(function(){
			return knex('users')
			.insert(users[0])
			.then(function(id){
				users[0].id = id[0];
				passwords[0].owner = users[0].id;
				passwords[1].owner = users[0].id;
				passwords[2].owner = users[0].id;
				return knex('users').insert(users[1]);
			})
			.then(function(id){
				users[1].id = id[0];
				return knex('passwords').insert(passwords[0]);
			})
			.then(function(id){
				passwords[0].id = id[0];
				return knex('passwords').insert(passwords[1]);
			})
			.then(function(id){
				passwords[1].id = id[0];
				return knex('passwords').insert(passwords[2]);
			})
			.then(function(id){
				passwords[2].id = id[0];
			})
		});

		before(function(done){
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
		})

		before(function(done){
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
		})

		it('should get all passwords for user with specific ID', function(done){
			server
			.get('/api/users/' + users[0].id + '/passwords')
			.set('Authorization', 'Bearer ' + tokens[0])	
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.deepEqual(res.body, passwords);

				return done();
			});
		});

		it('should fail when user tries to get all admins passwords', function(done){
			server
			.get('/api/users/' + users[1].id + '/passwords')
			.set('Authorization', 'Bearer ' + tokens[0])	
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});		
		});

		it('should fail when trying to get non-existant users passwords', function(done){
			server
			.get('/api/users/' + 1337 + '/passwords')
			.set('Authorization', 'Bearer ' + tokens[0])	
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'User was not found');

				return done();
			});				
		});

		it('should fail when trying passed invalid user id', function(done){
			server
			.get('/api/users/' + 'true' + '/passwords')
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

		after(function(){
			return knex('passwords')
			.where('id', passwords[0].id)
			.orWhere('id', passwords[1].id)
			.orWhere('id', passwords[2].id)
			.del()
			.then(function(){
				return knex('users')
				.where('id', users[0].id)
				.orWhere('id', users[1].id)
				.del()
			})
			.then(function(){});
		});
	});

	describe('POST', function(){


		it('should successfully create a new password', function(done){
			server
			.post('/api/users/'+idAuthToken+'/passwords')
			.set('Authorization', 'Bearer ' + authToken)	
			.send(validPassword)
			.expect(201)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.message, 'OK');
				assert.notEqual(res.body.id, NaN);
				
				validPassword.id = parseInt(res.body.id);

				return done();
			});
		});

		describe('failures on wrong input', function(){
		
			it('should fail when given invalid input for title', function(done){
				var temp = _.omit(validPassword, 'id');
				temp.title = true;

				server
				.post('/api/users/'+idAuthToken+'/passwords')
				.set('Authorization', 'Bearer ' + authToken)	
				.send(temp)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'title');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

			it('should fail when given invalid input for username', function(done){
				var temp = _.omit(validPassword, 'id');
				temp.username = true;

				server
				.post('/api/users/'+idAuthToken+'/passwords')
				.set('Authorization', 'Bearer ' + authToken)	
				.send(temp)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'username');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

			it('should fail when given invalid input for url', function(done){
				var temp = _.omit(validPassword, 'id');
				temp.url = true;

				server
				.post('/api/users/'+idAuthToken+'/passwords')
				.set('Authorization', 'Bearer ' + authToken)	
				.send(temp)
				.end(function(err, res){
					if(err) return done(err);
					
					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'url');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

		
			it('should fail when given invalid input for password', function(done){
				var temp = _.omit(validPassword, 'id');
				temp.password = true;

				server
				.post('/api/users/'+idAuthToken+'/passwords')
				.set('Authorization', 'Bearer ' + authToken)	
				.send(temp)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'password');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});
			
			it('should fail when given invalid encoding for password', function(done){
				var temp = _.omit(validPassword, 'id');
				temp.password = 'clearly not base 64';

				server
				.post('/api/users/'+idAuthToken+'/passwords')
				.set('Authorization', 'Bearer ' + authToken)	
				.send(temp)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'password');
					assert.equal(res.body.errors[0].error, 'pattern mismatch');

					return done();
				});
			});

			it('should fail when given invalid input for parent', function(done){
				var temp = _.omit(validPassword, 'id');
				temp.parent = 'test';

				server
				.post('/api/users/'+idAuthToken+'/passwords')
				.set('Authorization', 'Bearer ' + authToken)	
				.send(temp)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'parent');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

			it('should fail when given invalid input for note', function(done){
				var temp = _.omit(validPassword, 'id');
				temp.note = true;

				server
				.post('/api/users/'+idAuthToken+'/passwords')
				.set('Authorization', 'Bearer ' + authToken)	
				.send(temp)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'note');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});
		});
	});

	describe('PUT', function(){
		
		var PUT_password = {
			owner: 1,
			parent: 1,
			title: 'Death Star Back Entrance',
			username: 'AAAAAAAAA',
			password: base64.encode('AAAAAAAAA'),
		}

		before(function(){
			return knex('passwords')
			.insert(PUT_password)
			.then(function(id){
				PUT_password.id = id[0];
			});
		});


		var newTitle = 'Exposed Exhaust Port';
		it('should successfully update title of password', function(done){
			server
			.put('/api/users/'+idAuthToken+'/passwords/ ' + PUT_password.id)
			.set('Authorization', 'Bearer ' + authToken)	
			.send({title: newTitle})
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body, 'OK');

				return done();
			});
		});

		it('the previous test should have updated the data in the DB', function(){
			return knex('passwords')
			.select()
			.where('title', newTitle)
			.then(function(rows){
				assert.equal(rows.length, 		1);

				assert.equal(rows[0].title, 	newTitle);

				assert.equal(rows[0].id, 		PUT_password.id);
				assert.notEqual(rows[0].owner, 	NaN);
				assert.equal(rows[0].parent, 	PUT_password.parent);
				assert.equal(rows[0].username, 	PUT_password.username);
				assert.equal(rows[0].password, 	PUT_password.password);
				assert.equal(rows[0].iv, 		PUT_password.iv);
				assert.equal(rows[0].note, 		PUT_password.note);
			});
		});




		describe('failures on wrong input', function(){
			it('should fail when given invalid input for title', function(done){
				server
				.put('/api/users/'+idAuthToken+'/passwords/ ' + PUT_password.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({title: true})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'BadRequestError');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'title');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

			it('should fail when given invalid input for username', function(done){
				server
				.put('/api/users/'+idAuthToken+'/passwords/ ' + PUT_password.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({username: true})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'BadRequestError');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'username');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

			it('should fail when given invalid input for url', function(done){
				server
				.put('/api/users/'+idAuthToken+'/passwords/ ' + PUT_password.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({url: true})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'BadRequestError');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'url');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});
		
			it('should fail when given invalid input for password', function(done){
				server
				.put('/api/users/'+idAuthToken+'/passwords/ ' + PUT_password.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({password: true})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'BadRequestError');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'password');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});
			
			it('should fail when given invalid encoding for password', function(done){
				server
				.put('/api/users/'+idAuthToken+'/passwords/ ' +  PUT_password.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({password: 'this is clearly not base64'})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'BadRequestError');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'password');
					assert.equal(res.body.errors[0].error, 'pattern mismatch');

					return done();
				});
			});

			it('should fail when given invalid input for parent', function(done){
				server
				.put('/api/users/'+idAuthToken+'/passwords/ ' +  PUT_password.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({parent: 'test'})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'BadRequestError');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'parent');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

			it('should fail when given invalid input for note', function(done){
				server
				.put('/api/users/'+idAuthToken+'/passwords/ ' +  PUT_password.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({note: true})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'BadRequestError');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'note');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});
		});

		after(function(){
			return knex('passwords')
			.where('id', PUT_password.id)
			.del()
			.then(function(rows){

			});
		});
	});

	describe('DEL', function(){

		/*
			User IDs:
			1 : Admin
			2 : Non Admin
		*/

		var testData = [
			{
				owner: 1,
				parent: null,
				title: 'DELTestTitle1',
				username:'DELTestUsername1',
				password: base64.encode('DELTestPassword2'),
			},
			{
				owner: 2,
				parent: null,
				title: 'DELTestTitle2',
				username:'DELTestUsername2',
				password: base64.encode('DELTestPassword2'),
			},
			{
				owner: 2,
				parent: null,
				title: 'DELTestTitle3',
				username:'DELTestUsername3',
				password: base64.encode('DELTestPassword3'),
			}
		]

		before(function(){
			return knex('passwords')
			.insert(testData[0])
			.then(function(rows){
				testData[0].id = rows[0];
			});
		});

		before(function(){
			return knex('passwords')
			.insert(testData[1])
			.then(function(rows){
				testData[1].id = rows[0];
			});
		});
			
		before(function(){
			return knex('passwords')
			.insert(testData[2])
			.then(function(rows){
				testData[2].id = rows[0];
			});
		});
			



		it('should fail on deleting non-existant password', function(done){
			server
			.del('/api/users/'+idAuthToken+'/passwords/1337')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(404)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'Password was not found');

				return done();
			});

		});

		it('should fail when passed id is of the wrong type', function(done){
			server
			.del('/api/users/'+idAuthToken+'/passwords/true')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'BadRequestError');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'id');
				assert.equal(res.body.errors[0].error, 'is the wrong type');

				return done();
			})
		})

		it('should not allow non-admin to delete admins password', function(done){
			server
			.del('/api/users/'+idAuthToken+'/passwords/1')
			.set('Authorization', 'Bearer ' + otherAuthToken)
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);
				
				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});

		it('should allow admin to delete his own password', function(done){
			server
			.del('/api/users/'+idAuthToken+'/passwords/' + testData[0].id)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body, 'OK');

				return done();
			});	
		});

		it('should allow user to delete his own password', function(done){
			server
			.del('/api/users/'+idOtherAuthToken+'/passwords/' + testData[1].id)
			.set('Authorization', 'Bearer ' + otherAuthToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body, 'OK');

				return done();
			});	
		});

		it('should not allow admin to delete users password', function(done){
			server
			.del('/api/users/'+idOtherAuthToken+'/passwords/' + testData[2].id)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);
				
				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});


		after(function(){
			return knex('passwords')
			.where('id', testData[0].id)
			.orWhere('id', testData[1].id)
			.orWhere('id', testData[2].id)
			.del()
			.then(function(){});
		})

	});
});