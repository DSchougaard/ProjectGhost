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
		category: 1,
		title: 'Death Star Back Entrance',
		username: 'Obi Wan Kenobi',
		password: base64.encode('IMissQuiGonJinn'),
		iv: base64.encode('1111111111111111'),
		note: 'Darth Maul is a meanie!'
	};

	describe('GET/id', function(){

		var testID = 1;

		it('should successfully get a password', function(done){
			server
			.get('/api/users/'+idAuthToken+'/passwords/' + testID)
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

		it('should fail when trying to get a password, for a user that does not exist', function(done){
			server
			.get('/api/users/' + 1337 + '/passwords/' + testID)
			.set('Authorization', 'Bearer ' + authToken)	
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body.error, 'User does not exist');
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

				assert.equal(res.body.error, 'Password was not found');
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

				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'id');
				assert.equal(res.body.errors[0].error, 'is the wrong type');
				return done();
			});
		});

		it.skip('should fail when trying to get another user\'s password', function(done){
			server
			.get('/api/users/'+idAuthToken+'/passwords/' + 4)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.error, 'insufficient priveleges');
				return done();
			});
		});
	});

	describe('GET', function(){
		it('should get all passwords for user id 1', function(done){
			server
			.get('/api/users/' + 1 + '/passwords')
			.set('Authorization', 'Bearer ' + authToken)	
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				// Grap expected data
				var comparisonData = _.where(unittestData.passwordData, {owner: 1});

				// Check for length
				assert.equal(res.body.length, comparisonData.length);

				// Filter DB ids from the response
				var passwordsWithoutIDs = _.map(res.body, function(o) { return _.omit(o, 'id'); });

				assert.deepEqual(passwordsWithoutIDs, comparisonData);
				assert.notDeepEqual(passwordsWithoutIDs, unittestData.passwordData);

				return done();
			});
		});

		it.skip('should fail when user tries to get all admins passwords', function(done){
			server
			.get('/api/users/' + 1 + '/passwords')
			.set('Authorization', 'Bearer ' + otherAuthToken)	
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body.error, 'insufficient priveleges');
				return done();
			});		
		});

		it('should fail when trying to get non-existant users passwords', function(done){
			server
			.get('/api/users/' + 1337 + '/passwords')
			.set('Authorization', 'Bearer ' + authToken)	
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body.error, 'User does not exist');
				return done();
			});				
		});


		it('should fail when trying passed invalid user id', function(done){
			server
			.get('/api/users/' + 'true' + '/passwords')
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
				var temp = _.clone(validPassword);
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
				var temp = _.clone(validPassword);
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

			it('should fail when given invalid input for iv', function(done){
				var temp = _.clone(validPassword);
				temp.iv = true;

				server
				.post('/api/users/'+idAuthToken+'/passwords')
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
				.post('/api/users/'+idAuthToken+'/passwords')
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
				var temp = _.clone(validPassword);
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
				var temp = _.clone(validPassword);
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
				var temp = _.clone(validPassword);
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
		var newTitle = 'Exposed Exhaust Port';
		it('should successfully update title of password', function(done){
			server
			.put('/api/users/'+idAuthToken+'/passwords/ ' + validPassword.id)
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
				.put('/api/users/'+idAuthToken+'/passwords/ ' + validPassword.id)
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
				.put('/api/users/'+idAuthToken+'/passwords/ ' + validPassword.id)
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
				.put('/api/users/'+idAuthToken+'/passwords/ ' + validPassword.id)
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
				.put('/api/users/'+idAuthToken+'/passwords/ ' +  validPassword.id)
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
				.put('/api/users/'+idAuthToken+'/passwords/ ' + validPassword.id)
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
				.put('/api/users/'+idAuthToken+'/passwords/ ' +  validPassword.id)
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
				.put('/api/users/'+idAuthToken+'/passwords/ ' +  validPassword.id)
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
				.put('/api/users/'+idAuthToken+'/passwords/ ' +  validPassword.id)
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
				iv: base64.encode('1111111111111111')
			},
			{
				owner: 2,
				parent: null,
				title: 'DELTestTitle2',
				username:'DELTestUsername2',
				password: base64.encode('DELTestPassword2'),
				iv: base64.encode('1111111111111111')
			},
			{
				owner: 2,
				parent: null,
				title: 'DELTestTitle3',
				username:'DELTestUsername3',
				password: base64.encode('DELTestPassword3'),
				iv: base64.encode('1111111111111111')
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

				assert.equal(res.body.error, 'Password was not found');

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

				assert.equal(res.body.error, 'validation');
				assert.equal(res.body.errors.length, 1);
				assert.equal(res.body.errors[0].field, 'id');
				assert.equal(res.body.errors[0].error, 'is the wrong type');
				return done();
			})
		})

		it.skip('should not allow non-admin to delete admins password', function(done){
			server
			.del('/api/users/'+idAuthToken+'/passwords/1')
			.set('Authorization', 'Bearer ' + authToken)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.error, 'insufficient priveleges');

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

		it('should allow admin to delete users password', function(done){
			server
			.del('/api/users/'+idOtherAuthToken+'/passwords/' + testData[2].id)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				assert.equal(res.body, 'OK');

				return done();
			});
		});

	});
});