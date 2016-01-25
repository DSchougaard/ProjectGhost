/* global __base */
"use strict";

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
    

	describe('#find', function(){
		
		it('should fail when trying to find a non-existing id', function(){
			return Password.find(1337)
			.then(function(password){
				assert.fail();
			})
			.catch(PasswordDoesNotExistError, function(err){
				assert.equal(err.message, 1337);
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
                assert.equal(err.message, 1337);
            });
        });

    
        
        it('succeeds in creating new password', function(){
			return Password.create(validPassword)
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
                    
                    assert.equal(dbPassword[0].owner ,       password.owner );
                    assert.equal(dbPassword[0].parent ,      password.parent );
                    assert.equal(dbPassword[0].title,        password.title );
                    assert.equal(dbPassword[0].username ,    password.username );
                    assert.equal(dbPassword[0].password ,    password.password );
                    assert.equal(dbPassword[0].iv ,          password.iv );
                    assert.equal(dbPassword[0].note ,        password.note );
                }).bind(password);
			});
		});

        
        
    });
    
    
    
    
    
});