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
	var User = require(__base + 'model/user.js');
	var Password = require(__base + 'model/password.js');
    
    var validPassword = {
        'owner': 1,
        'parent': null,
        'title': 'How to Find the Rebels',
        'username': 'Count Boba Fett',
        'password': base64.encode('MandaloriansRulez'),
        'iv': base64.encode('1111111111111111'),
        'note': "I'll get revenge on that damned Skywalker!"
    };
	
	var validPasswordWithoutANote = {
        'owner': 1,
        'parent': null,
        'title': 'Sarlacc Pit',
        'username': 'Pew Pew',
        'password': base64.encode('He tasted good'),
        'iv': base64.encode('1111111111111111')
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
			return Password.find(1)
			.then(function(password){
				assert.equal(unittestData.passwordData[0].owner, password.owner);
				
				assert.equal(unittestData.passwordData[0].parent, password.parent);

				assert.equal(unittestData.passwordData[0].title, password.title);
				assert.equal(unittestData.passwordData[0].username, password.username);
				assert.equal(unittestData.passwordData[0].password, password.password);
				assert.equal(unittestData.passwordData[0].iv, password.iv);
			
				assert.equal(unittestData.passwordData[0].note, password.note);
			})
		});
        
        it('fails when given an ID of invalid type', function(){
            return Password.find(true)
            .then(function(password){
                assert.fail();
            })
            .catch(ValidationError, function(err){
               assert.equal(err.message, 'is wrong type');
               assert.equal(err.property, 'id'); 
            });
        });
        
	});
    
    describe('#create', function(){
        it('fails when exploiting data structure, to hardcode ID', function(){
            var temp = _.clone(validPassword);
            temp.id = 1337;

            return Password.create(temp)
            .then(function(password){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
            })
            .catch(ValidationError, function(err){
                assert.equal(err.message, 'has additional properties');
                assert.equal(err.property, 'data');
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
				//Assigned by the system. might have to re-adjust
				assert.equal(password.id, 5);
                
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
                    assert.equal(dbPassword[0].id, 5 );
                    
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
			
			var expectedID = 6;
			
			return Password.create(temp)
			.then(function(password){
				//Assigned by the system. might have to re-adjust
				assert.equal(password.id, expectedID);
                
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
                    assert.equal(dbPassword[0].id, expectedID );
                    
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
					assert.equal(err.cause, 'is required');
					assert.equal(err.property, 'data');
				});
			});

			it('should throw an error when creating a new password with owner field missing', function(){
				return Password.create( _.omit(validPassword, 'owner') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.cause, 'is required');
					assert.equal(err.property, 'data.owner');
				});
			});

			it('should throw an error when creating a new password with parent field missing', function(){
				return Password.create( _.omit(validPassword, 'parent') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.cause, 'is required');
					assert.equal(err.property, 'data.parent');
				});
			});
			
			it('should throw an error when creating a new password with title field missing', function(){
				return Password.create( _.omit(validPassword, 'title') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.cause, 'is required');
					assert.equal(err.property, 'data.title');
				});
			});
			

			it('should throw an error when creating a new password with username field missing', function(){
				return Password.create( _.omit(validPassword, 'username') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.cause, 'is required');
					assert.equal(err.property, 'data.username');
				});
			});

			it('should throw an error when creating a new password with password field missing', function(){
				return Password.create( _.omit(validPassword, 'password') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.cause, 'is required');
					assert.equal(err.property, 'data.password');
				});
			});

			it('should throw an error when creating a new password with iv field missing', function(){
				return Password.create( _.omit(validPassword, 'iv') )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.cause, 'is required');
					assert.equal(err.property, 'data.iv');
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
					assert.equal(err.cause, 'is the wrong type');
					assert.equal(err.property, 'data');
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
					assert.equal(err.cause, 'is the wrong type');
					assert.equal(err.property, 'data.owner');
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
					assert.equal(err.cause, 'is the wrong type');
					assert.equal(err.property, 'data.parent');
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
					assert.equal(err.cause, 'is the wrong type');
					assert.equal(err.property, 'data.title');
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
					assert.equal(err.cause, 'is the wrong type');
					assert.equal(err.property, 'data.username');
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
					assert.equal(err.cause, 'is the wrong type');
					assert.equal(err.property, 'data.password');
				});
			});

			it('should throw an error when creating a new password with iv of wrong type', function(){
				var temp = _.clone(validPassword);
				temp.iv = true;
				return Password.create( temp )
				.then(function(password){
					assert.fail();
				})
				.catch(ValidationError, function(err){
					assert.equal(err.cause, 'is the wrong type');
					assert.equal(err.property, 'data.iv');
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
					assert.equal(err.cause, 'is the wrong type');
					assert.equal(err.property, 'data.note');
				});
			});

		});
		
    });
    
	describe('#update', function(){
		it('successfully updates single field', function(){
			
			var testValue = 'SithCode Online';
			var testID = 1;
			
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
			var testID = 1;
						
			var originalPassword = undefined;
			return Password.find(1)
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
				assert.equal(updatedPassword.iv ,        originalPassword.iv );
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
					assert.equal(dbPassword[0].iv ,        originalPassword.iv );
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
				assert.equal(err.message, 'has additional properties');
				assert.equal(err.property, 'data');
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
					assert.equal(err.message, 'is the wrong type');
					assert.equal(err.property, 'data');
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
					assert.equal(err.message, 'is the wrong type');
					assert.equal(err.property, 'data.owner');
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
					assert.equal(err.message, 'is the wrong type');
					assert.equal(err.property, 'data.parent');
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
					assert.equal(err.message, 'is the wrong type');
					assert.equal(err.property, 'data.title');
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
					assert.equal(err.message, 'is the wrong type');
					assert.equal(err.property, 'data.username');
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
					assert.equal(err.message, 'is the wrong type');
					assert.equal(err.property, 'data.password');
				});
			});	
			
			it('should throw an error when creating a new password with iv of wrong type', function(){
				return Password.find(1)
				.then(function(password){
					return password.update({iv:true});
				})
				.then(function(updated){
					assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.message, 'is the wrong type');
					assert.equal(err.property, 'data.iv');
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
					assert.equal(err.message, 'is the wrong type');
					assert.equal(err.property, 'data.note');
				});
			});		
				
		});	
		
	});
	
	describe('#del', function(){
		it('fails when id has been edited to be invalid', function(){
			return Password.find(6)
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
		
		it('fails validation, when theuser has been tampered with and ID given another type', function(){
			return Password.find(6)
			.then(function(password){
				password.id = true;
				return password.del();
			})
			.then(function(r){
				assert.fail(undefined, undefined, 'Method succeeded when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.message, 'is the wrong type');
				assert.equal(err.property, 'data.id');
			});
		});
		
		it('succeedes in deleting a password', function(){
			return Password.find(1)
			.then(function(password){
				return password.del();
			})
			.then(function(r){
				assert.equal(r, true);
			});
		});
	});
	
	describe.only('#findAll', function(){
		it('successfully finds all of a user\'s passwords', function(){
			return User.find(1)
			.then(Password.findAll)
			.then(function(passwords){
				
				var expected = _.where(unittestData.passwordData, {owner: 1});
				var passwordsWithoutIDs = _.map(passwords, function(o) { return _.omit(o, 'id'); });
			
				assert.deepEqual(passwordsWithoutIDs, expected);
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
				publickey: base64.encode('fake')
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
				assert.equal(err.message, 'is required');
				assert.equal(err.property, 'data.id');	
			});
		});
		
	});
    
    
});