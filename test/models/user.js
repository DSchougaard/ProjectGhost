"use strict";

var assert = require('assert');

const fs 		= require('fs');
const _ 		= require('underscore');

const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');
const AlreadyExistError 	= require(__base + 'errors/Internal/AlreadyExistError.js');

const certs 				= require(__base + 'test/certs.js');
var base64 = require(__base + '/helpers/base64.js')

var knex = require(__base + 'database.js');
	var User = require(__base + 'models/user.js');

function generateTemplateUser(username){
	return {
		username 	: 'Models#User#' + username,
		salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
		password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
		privatekey 	: 'cGFzc3dvcmQ=',
		iv 			: 'cGFzc3dvcmQ=',
		pk_salt 	: 'cGFzc3dvcmQ=',
		publickey 	: 'cGFzc3dvcmQ='
	};
}



describe("User", function(){


	describe('#findAll', function(){

		var names = ['FindAll-User001', 'FindAll-User002', 'FindAll-User003'];

		before(function(){

			return knex('users')
			.insert([
				generateTemplateUser(names[0]),
				generateTemplateUser(names[1]),
				generateTemplateUser(names[2]),
			])
			.then();
		})

		it('should find the contents of the unittest database', function(){
			return User.findAll()
			.then(function(users){

				return knex
				.select('id', 'username', 'publickey', 'isAdmin')
				.from('users')
				.then(function(dbUsers){
					assert.deepEqual(users, dbUsers);
				});
			});
		});

		after(function(){
			return knex('users')
			.del()
			.then()
		})
	});
	
	describe('#create', function(){

		var newUser = undefined;
		before(function(){
			return knex('users')
			.insert(generateTemplateUser('Create-User001'))
			.then();
		})

		before(function(done){
			newUser = generateTemplateUser('Create-User002');
			done();
		});

		it('succeeds in creating new user', function(){
			var t = _.omit(newUser, 'password', 'salt');
			t.password = 'password';

			return User.create(t)
			.then(function(user){
				//console.log(h);
				assert.equal(user.username, 	newUser.username);
				assert.equal(user.isAdmin, 		false);
				assert.equal(user.privatekey, 	newUser.privatekey);
				assert.equal(user.publickey, 	newUser.publickey);

				return knex('users')
				.select()
				.where('username', user.username)
				.then(function(rows){
					assert.equal(rows.length, 			1);

					assert.equal(rows[0].username, 		newUser.username);
					assert.equal(rows[0].isAdmin, 		false);
					assert.equal(rows[0].privatekey, 	newUser.privatekey);
					assert.equal(rows[0].publickey, 	newUser.publickey);
				});
			});
		});

		it('fails when creating a user with already existing username', function(){

			var user = _.omit(generateTemplateUser('Create-User001'), 'password', 'salt');
			user.password = 'password';

			return User.create(user)
			.then(function(user){
				assert.fail(user);
			})
			.catch(AlreadyExistError, function(err){
				assert.equal(err.message, 'Username already exists');
			});
		})

		describe('missing fields', function(){ 

			var user = _.omit(generateTemplateUser('Create-User003'), 'password', 'salt');
			user.password = 'password';

			it('should throw error when creating a new user with undefined data', function(){
				return User.create(undefined)
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data is required.');
					assert.equal(err.errors[0].message, 'is required');
					assert.equal(err.errors[0].property, 'data');
				});
			});

			it('should throw error when creating a new user with undefined username', function(){
				return User.create( _.omit(user, 'username') )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.username is required.');
				});
			});

			/*it('should throw error when creating a new user with undefined admin bool', function(){
				return User.create( _.omit(validUser, 'isAdmin') )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.isAdmin is required.');
				});
			});*/

			it('should throw error when creating a new user with undefined password', function(){
				return User.create( _.omit(user, 'password') )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.password is required.');
				});
			});
			
	
			it('should throw error when creating a new user with undefined publickey', function(){
				return User.create( _.omit(user, 'publickey') )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.publickey is required.');
				});
			});

			it('should throw error when creating a new user with undefined privatekey', function(){
				return User.create( _.omit(user, 'privatekey') )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.privatekey is required.');
				});
			});
		});
	
		describe('wrong field types', function(){
			var user = _.omit(generateTemplateUser('Create-User004'), 'password', 'salt');
			user.password = 'password';


			it('should throw an error when creating a new user with data of wrong type', function(){
				return User.create(true)
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data is the wrong type.');
				});
			});

			it('should throw an error when creating a new user with username of wrong type', function(){
				var temp = _.clone(user);
				temp.username = true;
				return User.create( temp )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.username is the wrong type.');
				});
			});

			/*it('should throw an error when creating a new user with admin bool of wrong type', function(){
				var temp = _.clone(user);
				temp.isAdmin = "true";
				return User.create( temp )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.isAdmin is the wrong type.');
				});
			});*/

			it('should throw an error when creating a new user with password of wrong type', function(){
				var temp = _.clone(user);
				temp.password = true;
				return User.create( temp )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.password is the wrong type.');
				});
			});

			it('should throw an error when creating a new user with privatekey of wrong type', function(){
				var temp = _.clone(user);
				temp.privatekey = true;
				return User.create( temp )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.privatekey is the wrong type.');
				});
			});

			it('should throw an error when creating a new user with publickey of wrong type', function(){
				var temp = _.clone(user);
				temp.publickey = true;
				return User.create( temp )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.publickey is the wrong type.');
				});
			});
		});	

		after(function(){
			return knex('users')
			.del()
			.then()
		});
	});
	
	describe('#find', function(){

		var user = generateTemplateUser('Find-User001');
		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
			});
		})
		

		it('should fail when trying to find a non-existant id', function(){
			return User.find(1337)
			.then(function(user){
				assert.fail();
			})
			.catch(UserDoesNotExistError, function(err){
				assert.equal(err.message, 'User ID 1337 was not found');
			});
		});

		it('should fetch user when finding existing id', function(){
			return User.find(user.id)
			.then(function(_user){
				assert.equal(_user.id, 			user.id);

				assert.equal(_user.username, 	user.username);
				assert.equal(_user.isadmin, 	user.isadmin);
				assert.equal(_user.privatekey, 	user.privatekey);
				assert.equal(_user.publickey, 	user.publickey);
			});
		});

		it('should fail when given wrong input type', function(){
			return User.find(true)
			.then(function(user){
				assert.fail();
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data is the wrong type.');
			}); 
		});

		after(function(){
			return knex('users')
			.del()
			.then()
		});
	});

	describe('#put', function(){

		var users = [
			generateTemplateUser('Put-User001'),
			generateTemplateUser('Put-User002'),
			generateTemplateUser('Put-User003'),
			generateTemplateUser('Put-User004'),
			generateTemplateUser('Put-User005'),
			generateTemplateUser('Put-User006-MissingInput'),
			generateTemplateUser('Put-User007-InvalidInput')
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


		it('update password', function(){
			var oldValues = undefined;
			return User.find(users[0].id)
			.then(function(user){
				oldValues = _.clone(user);
				return user.update({password: 'LongLiveTheEmpire'})
			})
			.then(function(updatedUser){
				// check username, password and salt changed
				assert.notEqual(oldValues.salt, updatedUser.salt);
				assert.notEqual(oldValues.password, updatedUser.password);

				// check other fields are the same
				assert.equal(oldValues.id, updatedUser.id);
				assert.equal(oldValues.username, updatedUser.username);
				assert.equal(oldValues.isAdmin, updatedUser.isAdmin);
				assert.equal(oldValues.privatekey, updatedUser.privatekey);
				assert.equal(oldValues.publickey, updatedUser.publickey);

				return knex('users')
				.select()
				.where('id', updatedUser.id)
				.then(function(dbUser){
					assert.equal(dbUser.length, 1);

					assert.equal(dbUser[0].id, 	 		updatedUser.id);
					assert.equal(dbUser[0].username, 	updatedUser.username);
					assert.equal(dbUser[0].password, 	updatedUser.password);
					assert.equal(dbUser[0].salt, 		updatedUser.salt);
					assert.equal(dbUser[0].isAdmin,  	updatedUser.isAdmin);
					assert.equal(dbUser[0].privatekey,	updatedUser.privatekey);
					assert.equal(dbUser[0].publickey, 	updatedUser.publickey);
				});
			});
		});

		it('update username AND password', function(){
			var oldValues = undefined;
			return User.find(users[1].id)
			.then(function(user){
				oldValues = _.clone(user);
				return user.update({username: 'Darth Vader', password: 'DeathToTheJedi'})
			})
			.then(function(updatedUser){
				// check username, password and salt changed
				assert.equal(updatedUser.username, 'Darth Vader');
				assert.notEqual(oldValues.salt, updatedUser.salt);
				assert.notEqual(oldValues.password, updatedUser.password);

				// check other fields are the same
				assert.equal(oldValues.id, updatedUser.id);
				assert.equal(oldValues.isAdmin, updatedUser.isAdmin);
				assert.equal(oldValues.privatekey, updatedUser.privatekey);
				assert.equal(oldValues.publickey, updatedUser.publickey);

				return knex('users')
				.select()
				.where('id', updatedUser.id)
				.then(function(dbUser){
					assert.equal(dbUser.length, 1);

					assert.equal(dbUser[0].id, 	 		updatedUser.id);
					assert.equal(dbUser[0].username, 	updatedUser.username);
					assert.equal(dbUser[0].password, 	updatedUser.password);
					assert.equal(dbUser[0].salt, 		updatedUser.salt);
					assert.equal(dbUser[0].isAdmin,  	updatedUser.isAdmin);
					assert.equal(dbUser[0].privatekey,	updatedUser.privatekey);
					assert.equal(dbUser[0].publickey, 	updatedUser.publickey);
				});
			});
		});

		it('update username', function(){
			var oldValues = undefined;
			return User.find(users[2].id)
			.then(function(user){
				oldValues = _.clone(user);
				return user.update({username: 'Darth Sidious'})
			})
			.then(function(updatedUser){
				// check username has changed
				assert.equal(updatedUser.username, 'Darth Sidious');

				// ensure other values are the same
				assert.equal(oldValues.id, updatedUser.id);
				assert.equal(oldValues.isAdmin, updatedUser.isAdmin);
				assert.equal(oldValues.privatekey, updatedUser.privatekey);
				assert.equal(oldValues.publickey, updatedUser.publickey);
				assert.equal(oldValues.salt, updatedUser.salt);
				assert.equal(oldValues.password, updatedUser.password);

				return knex('users')
				.select()
				.where('id', updatedUser.id)
				.then(function(dbUser){
					assert.equal(dbUser.length, 1);

					assert.equal(dbUser[0].id, 	 		updatedUser.id);
					assert.equal(dbUser[0].username, 	updatedUser.username);
					assert.equal(dbUser[0].password, 	updatedUser.password);
					assert.equal(dbUser[0].salt, 		updatedUser.salt);
					assert.equal(dbUser[0].isAdmin,  	updatedUser.isAdmin);
					assert.equal(dbUser[0].privatekey,	updatedUser.privatekey);
					assert.equal(dbUser[0].publickey, 	updatedUser.publickey);
				});
			});
		});
		
		it('update privatekey', function(){
			var oldValues = undefined;
			return User.find(users[3].id)
			.then(function(user){
				oldValues = _.clone(user);
				return user.update({privatekey: base64.encode('ThisIsSOOOOMuchNotACert.....')})
			})
			.then(function(updatedUser){
				// check username has changed
				assert.equal(updatedUser.privatekey, base64.encode('ThisIsSOOOOMuchNotACert.....'));

				// ensure other values are the same
				assert.equal(oldValues.id, updatedUser.id);
				assert.equal(oldValues.isAdmin, updatedUser.isAdmin);
				assert.equal(oldValues.username, updatedUser.username);
				assert.equal(oldValues.publickey, updatedUser.publickey);
				assert.equal(oldValues.salt, updatedUser.salt);
				assert.equal(oldValues.password, updatedUser.password);

				return knex('users')
				.select()
				.where('id', updatedUser.id)
				.then(function(dbUser){
					assert.equal(dbUser.length, 1);

					assert.equal(dbUser[0].id, 	 		updatedUser.id);
					assert.equal(dbUser[0].username, 	updatedUser.username);
					assert.equal(dbUser[0].password, 	updatedUser.password);
					assert.equal(dbUser[0].salt, 		updatedUser.salt);
					assert.equal(dbUser[0].isAdmin,  	updatedUser.isAdmin);
					assert.equal(dbUser[0].privatekey,	updatedUser.privatekey);
					assert.equal(dbUser[0].publickey, 	updatedUser.publickey);
				});
			});
		});
	
		it('update publickey', function(){
			var oldValues = undefined;
			return User.find(users[4].id)
			.then(function(user){
				oldValues = _.clone(user);
				return user.update({publickey: base64.encode('ThisIsSOOOOMuchNotACert.....')})
			})
			.then(function(updatedUser){
				// check username has changed
				assert.equal(updatedUser.publickey, base64.encode('ThisIsSOOOOMuchNotACert.....'));

				// ensure other values are the same
				assert.equal(oldValues.id, updatedUser.id);
				assert.equal(oldValues.isAdmin, updatedUser.isAdmin);
				assert.equal(oldValues.username, updatedUser.username);
				assert.equal(oldValues.privatekey, updatedUser.privatekey);
				assert.equal(oldValues.salt, updatedUser.salt);
				assert.equal(oldValues.password, updatedUser.password);

				return knex('users')
				.select()
				.where('id', updatedUser.id)
				.then(function(dbUser){
					assert.equal(dbUser.length, 1);

					assert.equal(dbUser[0].id, 	 		updatedUser.id);
					assert.equal(dbUser[0].username, 	updatedUser.username);
					assert.equal(dbUser[0].password, 	updatedUser.password);
					assert.equal(dbUser[0].salt, 		updatedUser.salt);
					assert.equal(dbUser[0].isAdmin,  	updatedUser.isAdmin);
					assert.equal(dbUser[0].privatekey,	updatedUser.privatekey);
					assert.equal(dbUser[0].publickey, 	updatedUser.publickey);
				});
			});
		});

		it('should fail when no input is given', function(){
			return User.find(users[5].id)
			.then(function(user){
				return user.update()
			}).then(function(u){
				assert.fail();
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data is required.');
			});
		});
	
		describe('when given invalid fields in input, it', function(){

			it('should throw an error when creating a new user with data of wrong type', function(){
				return User.find(users[6].id)
				.then(function(user){
					return user.update(true)
				}).then(function(u){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data is the wrong type.');
				});
			});


			it('should throw an error when creating a new user with username of wrong type', function(){
				return User.find(users[6].id)
				.then(function(user){
					return user.update({username: true})
				}).then(function(u){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.username is the wrong type.');
				});
			});

			/*it('should throw an error when creating a new user with admin bool of wrong type', function(){
				return User.find(users[6].id)
				.then(function(user){
					return user.update({isAdmin: "true"})
				}).then(function(u){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.isAdmin is the wrong type.');
				});
			});*/

			it('should throw an error when creating a new user with password of wrong type', function(){
				return User.find(users[6].id)
				.then(function(user){
					return user.update({password: true})
				}).then(function(u){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.password is the wrong type.');
				});
			});

			it('should throw an error when creating a new user with privatekey of wrong type', function(){
				return User.find(users[6].id)
				.then(function(user){
					return user.update({privatekey: true})
				}).then(function(u){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.privatekey is the wrong type.');
				});
			});

			it('should throw an error when creating a new user with privatekey of wrong pattern', function(){
				return User.find(users[6].id)
				.then(function(user){
					return user.update({privatekey: 'this is not base 64'})
				}).then(function(u){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.privatekey pattern mismatch.');
				});
			});

			it('should throw an error when creating a new user with publickey of wrong type', function(){
				return User.find(users[6].id)
				.then(function(user){
					return user.update({publickey: true})
				}).then(function(u){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.publickey is the wrong type.');
				});
			});
		});


		after(function(){
			return knex('users')
			.del()
			.then()
		});
	});

	describe('#del', function(){

		var users = [
			generateTemplateUser('Del-User001'),
			generateTemplateUser('Del-User002')];

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
		});

		it('fails when id has been edited to be invalid', function(){
			return User.find(users[0].id)
			.then(function(user){
				user.id = 1337;
				return user.del();
			})
			.then(function(succeeded){
				assert.fail();
			})
			.catch(SqlError, function(err){
				assert.equal(err.message, 'User was not found');
			});
		});

		it('succeeds in deleting user', function(){
			var idForThisTest = 3;
			return User.find(users[1].id)
			.then(function(user){
				return user.del();
			})
			.then(function(succeeded){
				assert.equal(succeeded, true);
				
				return knex('users')
				.select()
				.where('id', idForThisTest)
				.then(function(rows){
					assert.equal(rows, 0);
				});
			});
		});

		it('fails validation, when user has been tampered with and ID given another type', function(){
			var fakeUser = {
				id: true
			}
			var t = new User(fakeUser);
			return t.del()
			.then(function(num){
				assert.fail();
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: user.id is the wrong type.');
			});
		});

		after(function(){
			return knex('users')
			.del()
			.then();
		});
	});

});
