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
});