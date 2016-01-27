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
	var otherAuthToken = '';

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
		category: 1,
		title: 'Death Star Back Entrance',
		username: 'Obi Wan Kenobi',
		password: base64.encode('IMissQuiGonJinn'),
		iv: base64.encode('1111111111111111'),
		note: 'Darth Maul is a meanie!'
	};

	describe('GET', function(){

		var testID = 1;

		it('should successfully get a password', function(done){
			server
			.get('/api/password/' + testID)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.owner, unittestData.passwordData[0].owner);
				assert.equal(res.body.parent, unittestData.passwordData[0].parent);
				assert.equal(res.body.title, unittestData.passwordData[0].title);
				assert.equal(res.body.username, unittestData.passwordData[0].username);
				assert.equal(res.body.password, unittestData.passwordData[0].password);
				assert.equal(res.body.iv, unittestData.passwordData[0].iv);
				assert.equal(res.body.note, unittestData.passwordData[0].note);

				return done();
			})
		});

		it('should fail trying to get a password that does not exist', function(done){
			server
			.get('/api/password/1337')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.error, 'Password was not found');
				return done();
			});
		});

		it('should fail trying to get a password when input is malformed', function(done){
			server
			.get('/api/password/true')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'id');
				assert.equal(res.body.errors[0].error, 'is the wrong type');
				return done();
			});
		});

		it.skip('should fail when trying to get another user\'s password', function(done){
			server
			.get('/api/password/' + 4)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.error, 'insufficient priveleges');
				return done();
			});
		});
	});

	describe('POST', function(){


		it('should successfully create a new password', function(done){
			server
			.post('/api/password')
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
				var temp = _.clone(validPassword);
				temp.title = true;

				server
				.post('/api/password')
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
				var temp = _.clone(validPassword);
				temp.username = true;

				server
				.post('/api/password')
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

			it('should fail when given invalid input for iv', function(done){
				var temp = _.clone(validPassword);
				temp.iv = true;

				server
				.post('/api/password')
				.set('Authorization', 'Bearer ' + authToken)	
				.send(temp)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'iv');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

			it('should fail when given invalid encoding for iv', function(done){
				var temp = _.clone(validPassword);
				temp.iv = 'clearly not base 64';

				server
				.post('/api/password')
				.set('Authorization', 'Bearer ' + authToken)	
				.send(temp)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'iv');
					assert.equal(res.body.errors[0].error, 'pattern mismatch');

					return done();
				});
			});
		
			it('should fail when given invalid input for password', function(done){
				var temp = _.clone(validPassword);
				temp.password = true;

				server
				.post('/api/password')
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
				var temp = _.clone(validPassword);
				temp.password = 'clearly not base 64';

				server
				.post('/api/password')
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
				var temp = _.clone(validPassword);
				temp.parent = 'test';

				server
				.post('/api/password')
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
				var temp = _.clone(validPassword);
				temp.note = true;

				server
				.post('/api/password')
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
		var newTitle = 'Exposed Exhaust Port';
		it('should successfully update title of password', function(done){
			server
			.put('/api/password/ ' + validPassword.id)
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

				assert.equal(rows[0].id, 		validPassword.id);
				assert.notEqual(rows[0].owner, 	NaN);
				assert.equal(rows[0].parent, 	validPassword.parent);
				assert.equal(rows[0].username, 	validPassword.username);
				assert.equal(rows[0].password, 	validPassword.password);
				assert.equal(rows[0].iv, 		validPassword.iv);
				assert.equal(rows[0].note, 		validPassword.note);
			});
		});




		describe('failures on wrong input', function(){
			it('should fail when given invalid input for title', function(done){
				server
				.put('/api/password/' + validPassword.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({title: true})
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
				server
				.put('/api/password/' + validPassword.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({username: true})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'username');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

			it('should fail when given invalid input for iv', function(done){
				server
				.put('/api/password/' + validPassword.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({iv: true})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'iv');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});
			});

			it('should fail when given invalid encoding for iv', function(done){
				server
				.put('/api/password/' + validPassword.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({iv: 'this is clearly not base64'})
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.error, 'validation');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'iv');
					assert.equal(res.body.errors[0].error, 'pattern mismatch');

					return done();
				});
			});
		
			it('should fail when given invalid input for password', function(done){
				server
				.put('/api/password/' + validPassword.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({password: true})
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
				server
				.put('/api/password/' + validPassword.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({password: 'this is clearly not base64'})
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
				server
				.put('/api/password/' + validPassword.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({parent: 'test'})
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
				server
				.put('/api/password/' + validPassword.id)
				.set('Authorization', 'Bearer ' + authToken)	
				.send({note: true})
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

	describe('DEL', function(){
		it('should fail on deleting non-existant password', function(done){
			server
			.del('/api/password/1337')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(404)
			.end(function(err,res){
				if(err) return done(err);

				assert.equal(res.body.error, 'Password was not found');

				return done();
			});

		});

		it('should fail when passed id is of the wrong type', function(done){
			server
			.del('/api/password/true')
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


		it.skip('should not allow non-admin to delete admin', function(done){
			server
			.del('/api/password/1')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.error, 'insufficient priveleges');

				return done();
			});
		});

		it('should allow admin to delete non-admin', function(done){
			server
			.del('/api/password/' + validPassword.id)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body, 'OK');

				return done();
			});	
		});

		it('should allow user to delete himself', function(done){
			server
			.del('/api/password/' + 2)
			.set('Authorization', 'Bearer ' + otherAuthToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body, 'OK');

				return done();
			});	
		});
	});
});