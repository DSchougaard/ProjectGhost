/* global __base */

///<reference path="../../typings/assert/assert.d.ts" />

"use strict";

var Promise = require('bluebird');

var assert = require('assert');

const fs 		= require('fs');
const base64 	= require(__base + 'helpers/base64.js');
const _ 		= require('underscore');

const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');

const unittestData = require(__base + 'misc/unitTestData.js');

var knex = require(__base + 'database.js');

describe('Password', function(){
	var User = require(__base + 'models/user.js');
	var Password = require(__base + 'models/password.js');
    
    var validPassword = {
        'owner': 2,
        'parent': null,
        'title': 'How to Find the Rebels',
        'username': 'Count Boba Fett',
        'password': base64.encode('MandaloriansRulez'),
        'note': "I'll get revenge on that damned Skywalker!"
    };
	
	var validPasswordWithoutANote = {
        'owner': 2,
        'parent': null,
        'title': 'Sarlacc Pit',
        'username': 'Pew Pew',
        'password': base64.encode('He tasted good'),
	}
    
	describe('Object creation and manipulation', function(){
		it('should allow edit on one object, without affecting the other', function(){
			return Promise.all([Password.find(1), Password.find(1)])
			.spread(function(passwordOne, passwordTwo){
				var originalValues = _.clone(passwordTwo);
				passwordOne.title = "Ugh, not that green little shit again.";
				
				assert.equal(passwordTwo.id, 		originalValues.id);
				assert.equal(passwordTwo.owner, 	originalValues.owner);
				assert.equal(passwordTwo.parent, 	originalValues.parent);
				assert.equal(passwordTwo.title, 	originalValues.title);
				assert.equal(passwordTwo.username, 	originalValues.username);
				assert.equal(passwordTwo.password, 	originalValues.password);
				assert.equal(passwordTwo.iv, 		originalValues.iv);
				assert.equal(passwordTwo.note, 		originalValues.note);

				
			});
		});
	});

	describe('#find', function(){
		var user = {
			username: 'Passwords#find-User001',
			salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
			password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
			isAdmin: false,
			privatekey: 'cGFzc3dvcmQ=',
			publickey: 'cGFzc3dvcmQ=',
			iv: 'cGFzc3dvcmQ=',
			pk_salt: 'cGFzc3dvcmQ='
		};

		var password = {
			parent 		: null,
			owner 		: undefined,
			title 		: 'Passwords#find-Title001',
			username 	: 'Passwords#find-User001',
			password 	: 'cGFzc3dvcmQ=',
			note 		: 'This is clearly a note!',
			url 		: null
		}

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
				password.owner = ids[0];
				return knex('passwords')
				.insert(password);
			})
			.then(function(ids){
				password.id = ids[0];		
			});
		})
		
		it('should fail when trying to find a non-existing id', function(){
			return Password.find(1337)
			.then(function(password){
				assert.fail();
			})
			.catch(PasswordDoesNotExistError, function(err){
				assert.equal(err.message, 'Password ID 1337 was not found');
			});
		});

		it('succeeds in finding existing password', function(){
			return Password.find(password.id)
			.then(function(password2){

				assert.equal(password.owner,	password2.owner);
				assert.equal(password.parent, 	password2.parent);
				assert.equal(password.title, 	password2.title);
				assert.equal(password.username, password2.username);
				assert.equal(password.password, password2.password.toString());
				assert.equal(password.iv, 		password2.iv);
				assert.equal(password.note, 	password2.note);
			})
		});
        
        it('fails when given an ID of invalid type', function(){
            return Password.find(true)
            .then(function(password){
                assert.fail();
            })
            .catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data.id is the wrong type.');
            });
        });
        
        after(function(){
        	return knex('passwords')
        	.where('id', password.id)
        	.del()
        	.then(function(r){
        		return knex('users')
        		.where('id', user.id)
        		.del();
        	})
        	.then(function(r){

        	});
        })
	});
    
    describe('#create', function(){

		var user = {
			username: 'Passwords#create-User001',
			salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
			password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
			isAdmin: false,
			privatekey: 'cGFzc3dvcmQ=',
			publickey: 'cGFzc3dvcmQ=',
			iv: 'cGFzc3dvcmQ=',
			pk_salt: 'cGFzc3dvcmQ='
		};

		var password = {
			parent 		: null,
			owner 		: undefined,
			title 		: 'Passwords#create-Title001',
			username 	: 'Passwords#create-User001',
			password 	: 'cGFzc3dvcmQ=',
			note 		: 'This is clearly a note!',
			url 		: null
		}

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
				password.owner = user.id;
			});
		})

        it('fails when exploiting data structure, to hardcode ID', function(){
            var temp = _.clone(validPassword);
            temp.id = 1337;

            return Password.create(temp)
            .then(function(password){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
            })
            .catch(ValidationError, function(err){
				assert.equal(err.message, '1 error: data has additional properties.');
				assert.equal(err.num, 1);

            });
        });


        it('fails when creating a password, with a non-existant owner', function(){
            var temp = _.clone(validPassword);
            temp.owner = 1337;
            
            return Password.create(temp)
            .then(function(password){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
            })
            .catch(UserDoesNotExistError, function(err){
                assert.equal(err.message, 'User ID 1337 was not found');
            });
        });

    
        
        it('succeeds in creating new password, with a note', function(){
			var temp = _.clone(validPassword);
			
			return Password.create(temp)
			.then(function(password){
                
                // Actual inserts
                assert.equal(password.owner , validPassword.owner );
                assert.equal(password.parent , validPassword.parent );
                assert.equal(password.title , validPassword.title );
                assert.equal(password.username , validPassword.username );
                assert.equal(password.password , validPassword.password );
                assert.equal(password.iv , validPassword.iv );
                assert.equal(password.note , validPassword.note );

                return knex
                .select()
                .from('passwords')
                .where('id', password.id)
                .then(function(dbPassword){
                    
                    assert.equal(dbPassword[0].owner ,   	 password.owner );
                    assert.equal(dbPassword[0].parent ,      password.parent );
                    assert.equal(dbPassword[0].title,        password.title );
                    assert.equal(dbPassword[0].username ,    password.username );
                    assert.equal(dbPassword[0].password ,    password.password );
                    assert.equal(dbPassword[0].iv ,          password.iv );
                    assert.equal(dbPassword[0].note ,        password.note );
                }).bind(password);
			});
		});
		
		it('succeeds in creating a new password, without a note', function(){
			var temp = _.clone(validPasswordWithoutANote);
			
			return Password.create(temp)
			.then(function(password){                
                // Actual inserts
                assert.equal(password.owner, 	validPasswordWithoutANote.owner );
                assert.equal(password.parent, 	validPasswordWithoutANote.parent );
                assert.equal(password.title, 	validPasswordWithoutANote.title );
                assert.equal(password.username, validPasswordWithoutANote.username );
                assert.equal(password.password, validPasswordWithoutANote.password );
                assert.equal(password.iv, 		validPasswordWithoutANote.iv );

                return knex
                .select()
                .from('passwords')
                .where('id', password.id)
                .then(function(dbPassword){
                    
                    assert.equal(dbPassword[0].owner ,   	 password.owner );
                    assert.equal(dbPassword[0].parent ,      password.parent );
                    assert.equal(dbPassword[0].title,        password.title );
                    assert.equal(dbPassword[0].username ,    password.username );
                    assert.equal(dbPassword[0].password ,    password.password );
                    assert.equal(dbPassword[0].iv ,          password.iv );

                }).bind(password);
			});
		})
		
		describe('missing fields', function(){
			it('should throw an error when creating a new password with missing input', function(){
				return Password.create()
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data is required.');
				});
			});

			it('should throw an error when creating a new password with owner field missing', function(){
				return Password.create( _.omit(validPassword, 'owner') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.owner is required.');
				});
			});

			it('should throw an error when creating a new password with parent field missing', function(){
				return Password.create( _.omit(validPassword, 'parent') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.parent is required.');
				});
			});
			
			it('should throw an error when creating a new password with title field missing', function(){
				return Password.create( _.omit(validPassword, 'title') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.title is required.');
				});
			});
			

			it('should throw an error when creating a new password with password field missing', function(){
				return Password.create( _.omit(validPassword, 'password') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.password is required.');
				});
			});
		});
		
		describe('wrong field types', function(){
			it('should throw an error when creating a new password with data of wrong type', function(){
				return Password.create(true)
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data is the wrong type.');
				});
			});

			it('should throw an error when creating a new password with owner of wrong type', function(){
				var temp = _.clone(validPassword);
				temp.owner = true;
				return Password.create( temp )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.owner is the wrong type.');
				});
			});

			it('should throw an error when creating a new password with parent of wrong type', function(){
				var temp = _.clone(validPassword);
				temp.parent = true;
				return Password.create( temp )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.parent is the wrong type.');
				});
			});
			
			it('should throw an error when creating a new password with title of wrong type', function(){
				var temp = _.clone(validPassword);
				temp.title = true;
				return Password.create( temp )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.title is the wrong type.');
				});
			});
			

			it('should throw an error when creating a new password with username of wrong type', function(){
				var temp = _.clone(validPassword);
				temp.username = true;
				return Password.create( temp )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.username is the wrong type.');
				});
			});

			it('should throw an error when creating a new password with password of wrong type', function(){
				var temp = _.clone(validPassword);
				temp.password = true;
				return Password.create( temp )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.password is the wrong type.');
				});
			});

			it('should throw an error when creating a new password with note of wrong type', function(){
				var temp = _.clone(validPassword);
				temp.note = true;
				return Password.create( temp )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.note is the wrong type.');
				});
			});
		});
		
		after(function(){
			return knex('passwords')
			.where('id', password.id)
			.del()
			.then(function(){
				return knex('users')
				.where('id', user.id)
				.del()
			})
			.then(function(){ });
		});

    });
    
	describe('#update', function(){
		it('successfully updates single field', function(){
			
			var testValue = 'SithCode Online';
			var testID = 4;
			
			var originalPassword = undefined;
			return Password.find(testID)
			.then(function(password){
				originalPassword = _.clone(password);
				return password.update({title: testValue});
			})
			.then(function(updatedPassword){
				assert.equal(updatedPassword.id, 		 testID);
				assert.equal(updatedPassword.owner ,     originalPassword.owner );
				assert.equal(updatedPassword.parent ,    originalPassword.parent );
				assert.equal(updatedPassword.title,      testValue );
				assert.equal(updatedPassword.username ,  originalPassword.username );
				assert.equal(updatedPassword.password ,  originalPassword.password );
				assert.equal(updatedPassword.iv ,        originalPassword.iv );
				assert.equal(updatedPassword.note ,      originalPassword.note );
				
				return knex('passwords')
				.select()
				.where('id', testID)
				.then(function(dbPassword){
					assert.equal(dbPassword[0].id, 			testID);
					assert.equal(dbPassword[0].owner ,     originalPassword.owner );
					assert.equal(dbPassword[0].parent ,    originalPassword.parent );
					assert.equal(dbPassword[0].title,      testValue );
					assert.equal(dbPassword[0].username ,  originalPassword.username );
					assert.equal(dbPassword[0].password ,  originalPassword.password );
					assert.equal(dbPassword[0].iv ,        originalPassword.iv );
					assert.equal(dbPassword[0].note ,      originalPassword.note );
				});
			});
		});
		
		it('successfully updates several fields', function(){
			
			var testValues = [ 'Rebel Dating', 'BlueSaber132' ];
			var testID = 4;
						
			var originalPassword = undefined;
			return Password.find(testID)
			.then(function(password){
				originalPassword = _.clone(password);
				return password.update({title: testValues[0], username: testValues[1] });
			})
			.then(function(updatedPassword){
				assert.equal(updatedPassword.id, 		 testID);
				assert.equal(updatedPassword.owner ,     originalPassword.owner );
				assert.equal(updatedPassword.parent ,    originalPassword.parent );
				assert.equal(updatedPassword.title,      testValues[0] );
				assert.equal(updatedPassword.username ,  testValues[1] );
				assert.equal(updatedPassword.password ,  originalPassword.password );
				assert.equal(updatedPassword.note ,      originalPassword.note );
				
				return knex('passwords')
				.select()
				.where('id', testID)
				.then(function(dbPassword){
					assert.equal(dbPassword[0].id, 			testID);
					assert.equal(dbPassword[0].owner ,     originalPassword.owner );
					assert.equal(dbPassword[0].parent ,    originalPassword.parent );
					assert.equal(dbPassword[0].title,      testValues[0] );
					assert.equal(dbPassword[0].username ,  testValues[1] );
					assert.equal(dbPassword[0].password ,  originalPassword.password );
					assert.equal(dbPassword[0].note ,      originalPassword.note );
				});
			});
			
		});
		
		it('should fail when trying to update id', function(){
			return Password.find(1)
			.then(function(password){
				return password.update({id: 1337});
			})
			.then(function(updatedPassword){
				assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
			})
			.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data has additional properties.');
			});
		})
		
		describe('fails on wrong input for update', function(){
			
			it('should throw an error when creating a new password with data of wrong type', function(){
				return Password.find(1)
				.then(function(password){
					return password.update(true);
				})
				.then(function(updated){
					assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data is the wrong type.');
				});
			});
			
			it('should throw an error when creating a new password with owner of wrong type', function(){
				return Password.find(1)
				.then(function(password){
					return password.update({owner:true});
				})
				.then(function(updated){
					assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.owner is the wrong type.');
				});
			});
			
			it('should throw an error when creating a new password with parent of wrong type', function(){
				return Password.find(1)
				.then(function(password){
					return password.update({parent:true});
				})
				.then(function(updated){
					assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.parent is the wrong type.');
				});
			});		
			
			it('should throw an error when creating a new password with title of wrong type', function(){
				return Password.find(1)
				.then(function(password){
					return password.update({title:true});
				})
				.then(function(updated){
					assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.title is the wrong type.');
				});
			});		
						
			it('should throw an error when creating a new password with username of wrong type', function(){
				return Password.find(1)
				.then(function(password){
					return password.update({username:true});
				})
				.then(function(updated){
					assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.username is the wrong type.');
				});
			});			
		
			it('should throw an error when creating a new password with password of wrong type', function(){
				return Password.find(1)
				.then(function(password){
					return password.update({password:true});
				})
				.then(function(updated){
					assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.password is the wrong type.');
				});
			});	
							
			
			it('should throw an error when creating a new password with note of wrong type', function(){
				return Password.find(1)
				.then(function(password){
					return password.update({note:true});
				})
				.then(function(updated){
					assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.note is the wrong type.');
				});
			});		
				
		});	
		
	});
	
	describe('#del', function(){
		
		var user = {
			username: 'Models#Passwords#del-User001',
			salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
			password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
			isAdmin: false,
			privatekey: 'cGFzc3dvcmQ=',
			publickey: 'cGFzc3dvcmQ=',
			iv: 'cGFzc3dvcmQ=',
			pk_salt: 'cGFzc3dvcmQ='
		};

		var password = {
			parent 		: null,
			owner 		: undefined,
			title 		: 'Models#Passwords#del-Title001',
			username 	: 'Models#Passwords#del-User001',
			password 	: 'cGFzc3dvcmQ=',
			note 		: 'This is clearly a note!',
			url 		: null
		}

		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){
				user.id = ids[0];
				password.owner = user.id;
				return knex('passwords').insert(password);
			})
			.then(function(ids){
				password.id = ids[0];
			});
		})

		it('fails when id has been edited to be invalid', function(){
			return Password.find(password.id)
			.then(function(password){
				password.id = 1337;
				return password.del();
			})
			.then(function(r){
				assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
			})
			.catch(PasswordDoesNotExistError, function(err){
				assert.equal(err.message, 'Password ID 1337 was not found');
			});
		})
		
		it('fails validation, when the user has been tampered with and ID given another type', function(){
			return Password.find(password.id)
			.then(function(password){
				password.id = true;
				return password.del();
			})
			.then(function(r){
				assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
			})
			.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.id is the wrong type.');
			});
		});
		
		it('succeedes in deleting a password', function(){
			return Password.find(password.id)
			.then(function(password){
				return password.del();
			})
			.then(function(r){
				assert.equal(r, true);
			});
		});

		after(function(){
			return knex('passwords')
			.where('id', password.id)
			.del()
			.then(function(){
				return knex('users')
				.where('id', user.id)
				.del();
			})
			.then(function(){ });
		})
	});
	
	describe('#findAll', function(){

		var user = {
			username: 'Passwords#findAll-User001',
			salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
			password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
			isAdmin: false,
			privatekey: 'cGFzc3dvcmQ=',
			publickey: 'cGFzc3dvcmQ=',
			iv: 'cGFzc3dvcmQ=',
			pk_salt: 'cGFzc3dvcmQ='
		};

		var passwords = [
			{
				parent 		: null,
				owner 		: undefined,
				title 		: 'Passwords#findAll-Title001',
				username 	: 'Passwords#findAll-User001',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: undefined,
				title 		: 'Passwords#findAll-Title002',
				username 	: 'Passwords#findAll-User002',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: undefined,
				title 		: 'Passwords#findAll-Title002',
				username 	: 'Passwords#findAll-User002',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];


		before(function(){
			return knex('users')
			.insert(user)
			.then(function(ids){
				passwords[0].owner = ids[0];
				passwords[1].owner = ids[0];
				passwords[2].owner = ids[0];

				user.id = ids[0];

				return knex('passwords').insert(passwords[0]);
			})
			.then(function(ids){
				passwords[0].id = ids[0];
				return knex('passwords').insert(passwords[1]);
			})
			.then(function(ids){
				passwords[1].id = ids[0];
				return knex('passwords').insert(passwords[2]);
			})
			.then(function(ids){
				passwords[2].id = ids[0];
			});
		})


		it('successfully finds all of a user\'s passwords', function(){
			return User.find( user.id )
			.then(Password.findAll)
			.then(function(passwords2){
				
				//var passwordsWithoutIDs = _.map(passwords, function(o) { return _.omit(o, 'id'); });
			
				assert.deepEqual(passwords, passwords2);
			});
		});
		
		it('succeeds when passed a user that does not exist, but returns empty list', function(){
			var fakeData = {
				id: 1337,
				isAdmin: false,
				username: 'Fake',
				password: 'Fake',
				salt: 'Fake',
				privatekey: base64.encode('fake'),
				publickey: base64.encode('fake'),
				iv: base64.encode('11111111'),
				pk_salt: "Gvfqk3Dp/ezVweCxJ1BZgDADKWHDQGhy7tyEU5p+p3kZ9N8eWcPTEfLXqplZA5WVqMbLB3slU47jPXnj4krRDywT6CnK096wWP7Mc3khwlaRFLyjnf0u3TD9hs0udc194JwYXq0fAuzvM36iKlpXeGFDBVtP4NZV/7OIJX1LBkI=",
				two_factor_enabled: false
			}
			var fake = new User(fakeData);
			
			return Password.findAll(fake)
			.then(function(passwords){
				assert.deepEqual(passwords, []);
			});
		});
		
		it('fails when passed an invalid user object', function(){
			var fake = new User({username: 'ImDaCaptainNow'});
			return Password.findAll(fake)
			.then(function(passwords){
				assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 9);
				assert.equal(err.message, '9 errors: data.id is required. data.isAdmin is required. data.salt is required. data.password is required. data.publickey is required. data.privatekey is required. data.iv is required. data.pk_salt is required. data.two_factor_enabled is required.');
			});
		});
		

        after(function(){
        	return knex('passwords')
        	.where('id', passwords[0].id)
        	.orWhere('id', passwords[1].id)
        	.orWhere('id', passwords[2].id)
        	.del()
        	.then(function(r){
        		return knex('users')
        		.where('id', user.id)
        		.del();
        	})
        	.then(function(r){ });
        })


	});
    
    
});