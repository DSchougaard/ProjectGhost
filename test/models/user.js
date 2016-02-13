"use strict";

var assert = require('assert');

const fs 		= require('fs');
const base64 	= require(__base + 'helpers/base64.js');
const _ 		= require('underscore');

const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');

const unittestData = require(__base + 'misc/unitTestData.js');


var knex = require(__base + 'database.js');


describe("User", function(){
	
	var User = require(__base + 'models/user.js');

	var validUser;

	before(function(done){

		validUser = {
			username: 'Anakin Skywalker',
			isAdmin: true,
			password: 'password',
			privatekey: base64.encode(fs.readFileSync('misc/unittest-private.key').toString('utf8')),
			publickey: base64.encode(fs.readFileSync('misc/unittest-public.crt').toString('utf8')),
			pk_salt 	: "Gvfqk3Dp/ezVweCxJ1BZgDADKWHDQGhy7tyEU5p+p3kZ9N8eWcPTEfLXqplZA5WVqMbLB3slU47jPXnj4krRDywT6CnK096wWP7Mc3khwlaRFLyjnf0u3TD9hs0udc194JwYXq0fAuzvM36iKlpXeGFDBVtP4NZV/7OIJX1LBkI=",
			iv 			: base64.encode('111111111')
		}
		done();
	});
	
	describe('#findAll', function(){
		it('should find the contents of the unittest database', function(){
			return User.findAll()
			.then(function(users){
				
				return knex
				.select('id', 'username', 'publickey')
				.from('users')
				.then(function(dbUsers){
					assert.deepEqual(users, dbUsers);
				});
			});
		});
	})
	
	
	describe('#create', function(){

		it('succeeds in creating new user', function(){
			return User.create(validUser)
			.then(function(user){
				//console.log(h);
				assert.equal(user.id, 3);
				assert.equal(user.username, validUser.username);
				assert.equal(user.isAdmin, validUser.isAdmin);
				assert.equal(user.privatekey, validUser.privatekey);
				assert.equal(user.publickey, validUser.publickey);
			});
		});

		it('fails when creating a user with already existing username', function(){
			var temp = _.clone(validUser);
			temp.username = unittestData.userData[0].username;
			return User.create(temp)
			.then(function(user){
				assert.fail(user);
			})
			.catch(SqlError, function(err){
				assert.equal(err.message, 'Username already exists');
			});
		})

		describe('missing fields', function(){ 
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
				return User.create( _.omit(validUser, 'username') )
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
				return User.create( _.omit(validUser, 'password') )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.password is required.');
				});
			});
			
	
			it('should throw error when creating a new user with undefined publickey', function(){
				return User.create( _.omit(validUser, 'publickey') )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.publickey is required.');
				});
			});

			it('should throw error when creating a new user with undefined privatekey', function(){
				return User.create( _.omit(validUser, 'privatekey') )
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
				var temp = _.clone(validUser);
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

			it('should throw an error when creating a new user with admin bool of wrong type', function(){
				var temp = _.clone(validUser);
				temp.isAdmin = "true";
				return User.create( temp )
				.then(function(user){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.isAdmin is the wrong type.');
				});
			});

			it('should throw an error when creating a new user with password of wrong type', function(){
				var temp = _.clone(validUser);
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
				var temp = _.clone(validUser);
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
				var temp = _.clone(validUser);
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
	});
	
	describe('#find', function(){
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
			return User.find(1)
			.then(function(user){
				assert.equal(1, 									user.id);

				assert.equal(unittestData.userData[0].username, 	user.username);
				assert.equal(unittestData.userData[0].isadmin, 		user.isadmin);
				assert.equal(unittestData.userData[0].privatekey, 	user.privatekey);
				assert.equal(unittestData.userData[0].publickey, 	user.publickey);
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
		})
	});

	describe('#put', function(){
		it('update password', function(){
			var oldValues = undefined;
			return User.find(3)
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
			return User.find(3)
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
			return User.find(3)
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
			return User.find(3)
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
			return User.find(3)
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
			return User.find(3)
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
				return User.find(3)
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
				return User.find(3)
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

			it('should throw an error when creating a new user with admin bool of wrong type', function(){
				return User.find(3)
				.then(function(user){
					return user.update({isAdmin: "true"})
				}).then(function(u){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.isAdmin is the wrong type.');
				});
			});

			it('should throw an error when creating a new user with password of wrong type', function(){
				return User.find(3)
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
				return User.find(3)
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
				return User.find(3)
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
				return User.find(3)
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
	});

	describe('#del', function(){
		it('fails when id has been edited to be invalid', function(){
			User.find(3)
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
			User.find(idForThisTest)
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


	});

});
