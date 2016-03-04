/* global __base */

///<reference path="../../typings/assert/assert.d.ts" />

"use strict";

var Promise = require('bluebird');
var assert = require('assert');
const _ 		= require('underscore');

const PasswordDoesNotExistError = require(__base + 'errors/PasswordDoesNotExistError.js');
const ValidationError 		= require(__base + 'errors/ValidationError.js');
const UserDoesNotExistError = require(__base + 'errors/UserDoesNotExistError.js');
const SqlError 				= require(__base + 'errors/SqlError.js');
const CategoryDoesNotExistError = require(__base + 'errors/CategoryDoesNotExistError.js');
const UnauthorizedError 		= require(__base + 'errors/UnauthorizedError.js');

const unittestData = require(__base + 'misc/unitTestData.js');

var knex = require(__base + 'database.js');

// Models
var Category = require(__base + 'models/category.js');
var User = require(__base + 'models/user.js');


describe('Category', function(){

	describe('#find', function(){
		var cat = {
			title: 'FIND-TestCat0001',
			owner: 1,
			parent: null
		}

		before(function(){
			return knex('categories')
			.insert(cat)
			.then(function(ids){
				cat.id = ids[0];
			});
		});

		it('should successfully find existing category', function(){
			return Category.find(cat.id)
			.then(function(category){
				assert.equal(category.id, cat.id);
				assert.equal(category.owner, cat.owner);
				assert.equal(category.parent, cat.parent);
				assert.equal(category.title, cat.title);
			});
		});

		it('should throw error when trying to find non exisint category', function(){
			return Category.find(1337)
			.then(function(category){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(CategoryDoesNotExistError, function(err){
				assert.equal(err.name , 'CategoryDoesNotExistError');
				assert.equal(err.id, 1337);
			})
		});

		after(function(){
			return knex('categories')
			.where('id', cat.id)
			.del();
		});
	});

	describe('#findAll', function(){

		var findall_trx = undefined;

		var users = [
			{
				username: 'FindAll-User1',
				isAdmin: false,
				salt: 'aaaa==',
				password: 'aaaa=',
				privatekey: 'aaaa=',
				iv: 'aaaa=',
				pk_salt: 'aaaa=',
				publickey: 'aaaa='
			},
			{
				username: 'FindAll-User2',
				isAdmin: false,
				salt: 'aaaa==',
				password: 'aaaa=',
				privatekey: 'aaaa=',
				iv: 'aaaa=',
				pk_salt: 'aaaa=',
				publickey: 'aaaa='
			},
			{
				username: 'FindAll-User3',
				isAdmin: false,
				salt: 'aaaa==',
				password: 'aaaa=',
				privatekey: 'aaaa=',
				iv: 'aaaa=',
				pk_salt: 'aaaa=',
				publickey: 'aaaa='
			}
		]

		var categories = [
			{
				title: 'FINDALL-TestCat0001',
				owner: 1,
				parent: null
			},
			{
				title: 'FINDALL-TestCat0002',
				owner: 1,
				parent: null
			},
			{
				title: 'FINDALL-TestCat0003',
				owner: 1,
				parent: null
			},
			{
				title: 'FINDALL-TestCat0004',
				owner: 2,
				parent: null
			},
			{
				title: 'FINDALL-TestCat0005',
				owner: 2,
				parent: null
			}
		]

		before(function(){
			
			return knex('users').insert(users[0])
			.then(function(ids){
				users[0].id = ids[0];
				return knex('users').insert(users[1]);
			})
			.then(function(ids){
				users[1].id = ids[0];
				return knex('users').insert(users[2]);
			})
			.then(function(ids){
				users[2].id = ids[0];
				return knex('categories').insert(categories[0]);
			})
			.then(function(ids){
				categories[0].id = ids[0];
				return knex('categories').insert(categories[1]);	
			})
			.then(function(ids){
				categories[1].id = ids[0];
				return knex('categories').insert(categories[2]);	
			})
			.then(function(ids){
				categories[2].id = ids[0];
				return knex('categories').insert(categories[3]);	
			})
			.then(function(ids){
				categories[3].id = ids[0];
				return knex('categories').insert(categories[4]);	
			})
			.then(function(ids){
				categories[4].id = ids[0];
			});

		});

		it('should show one list for User #1', function(){
			var user = new User(users[0]);
			
			return Category.findAll(user)
			.then(function(categories){
				assert.deepEqual(categories, _.where(categories, {owner: users[0].id}) );
			})
			.catch(function(err){
            	assert.fail(undefined,undefined, 'Method failed, when it should have succeeded');
			})
		});

		it('should show another list for User #2', function(){
			var user = new User(users[1]);
			
			return Category.findAll(user)
			.then(function(categories){
				assert.deepEqual(categories, _.where(categories, {owner: users[1].id}) );
			})
			.catch(function(err){
            	assert.fail(undefined,undefined, 'Method failed, when it should have succeeded');
			})
		});

		it('should return empty list, for user without any categories', function(){
			var user = new User(users[2]);

			return Category.findAll(user)
			.then(function(categories){
				assert.equal(categories.length, 0);
			})
			.catch(function(err){
            	assert.fail(undefined,undefined, 'Method failed, when it should have succeeded');
			})	
		});

		it('should return empty list, for non-existant user', function(){
			var user = new User({id: 1337});

			return Category.findAll(user)
			.then(function(categories){
				assert.equal(categories.length, 0);
			})
			.catch(function(err){
            	assert.fail(undefined,undefined, 'Method failed, when it should have succeeded');
			})	
		});

		after(function(){
			return knex('categories')
			.where('id', categories[0].id)
			.orWhere('id', categories[1].id)
			.orWhere('id', categories[2].id)
			.orWhere('id', categories[3].id)
			.orWhere('id', categories[4].id)
			.del()
			.then(function(rows){
				return knex('users')
				.where('id', users[0].id)
				.orWhere('id', users[1].id)
				.orWhere('id', users[2].id)
				.del()
				.then(function(rows){

				});
			});
		});

		/*
		after(function(){
			return knex('users')
			.where('id', users[0].id)
			.orWhere('id', users[1].id)
			.del();
		});*/
	});

	describe('#create', function(){
		var cat = {
			title: 'CREATE-TestCat0001',
			owner: 1,
			parent: null
		}

		var otherCat = {
			title: 'CREATE-TestCat0001',
			owner: 2,
			parent: null
		}

		before(function(){
			return knex('categories')
			.insert(otherCat)
			.then(function(ids){
				otherCat.id = ids[0];
			});
		});

		it('should fail when creating category with non-existant parent', function(){
			var tmp = _.clone(cat);
			tmp.parent = 1337;
			return Category.create(tmp)
			.then(function(category){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(CategoryDoesNotExistError, function(err){
				assert.equal(err.id, 1337);
				assert.equal(err.name, "CategoryDoesNotExistError");
			});
		});

		it('should fail when creating category with non-existant owner', function(){
			var tmp = _.clone(cat);
			tmp.owner = 1337;
			return Category.create(tmp)
			.then(function(category){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(UserDoesNotExistError, function(err){
				assert.equal(err.id, 1337);
				assert.equal(err.name, "UserDoesNotExistError");
			});
		});

		it('should fail when creating category with invalid parent', function(){
			var tmp = _.clone(cat);
			tmp.parent = true;
			return Category.create(tmp)
			.then(function(category){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data.parent is the wrong type.');
			});
		});

		it('should fail when creating category with invalid title', function(){
			var tmp = _.clone(cat);
			tmp.title = true;
			return Category.create(tmp)
			.then(function(category){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data.title is the wrong type.');
			});
		});

		it('should fail when creating category with invalid owner', function(){
			var tmp = _.clone(cat);
			tmp.owner = true;
			return Category.create(tmp)
			.then(function(category){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data.owner is the wrong type.');
			});
		});

		it('should fail when creating category without owner', function(){
			var tmp = _.omit(cat, 'owner');
			return Category.create(tmp)
			.then(function(category){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data.owner is required.');
			});
		});

		it('should fail when creating category without title', function(){
			var tmp = _.omit(cat, 'title');
			return Category.create(tmp)
			.then(function(category){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(ValidationError, function(err){
				assert.equal(err.num, 1);
				assert.equal(err.message, '1 error: data.title is required.');
			});
		});

		it('should fail when creating category as child to category owned by other user', function(){
			var tmp = _.clone(cat);
			tmp.parent = otherCat.id;

			return Category.create(tmp)
			.then(function(){
                assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(UnauthorizedError, function(err){
				assert.equal(err.cause, 'Parent category has other owner');
			});		
		})

		it('should successfully create category', function(){
			return Category.create(cat)
			.then(function(category){
				assert.equal(category.title, cat.title);
				assert.equal(category.owner, cat.owner);
				assert.equal(category.parent, cat.parent);

				cat.id = category.id;

				return knex('categories')
				.where('id', cat.id)
				.then(function(rows){
					assert.equal(rows[0].title,  cat.title);
					assert.equal(rows[0].owner,  cat.owner);
					assert.equal(rows[0].parent, cat.parent);
					assert.equal(rows[0].id,     cat.id);

				});

			});
		});
		
		after(function(){
			return knex('categories')
			.where('id', cat.id)
			.orWhere('id', otherCat.id)
			.del()
			.then(function(){ })
		});
	});

	describe('#update', function(){
		var categories = [
			{
				title: 'UPDATE-TestCat0001',
				owner: 1,
				parent: null
			},
			{
				title: 'UPDATE-TestParentCat0001',
				owner: 1,
				parent: null
			},
			{
				title: 'UPDATE-TestParentCat0002',
				owner: 2,
				parent: null
			},
		]

		before(function(){
			return knex('categories')
			.insert(categories[0])
			.then(function(ids){
				categories[0].id = ids[0];
			});
		});

		before(function(){
			return knex('categories')
			.insert(categories[1])
			.then(function(ids){
				categories[1].id = ids[0];
			});
		});

		before(function(){
			return knex('categories')
			.insert(categories[2])
			.then(function(ids){
				categories[2].id = ids[0];
			});
		});

		describe('validation', function(){

			it('should fail when trying to update with invalid parent field', function(){
				return Category.find(categories[0].id)
				.then(function(category){
					return category.update({parent: true});
				})
				.then(function(){
                	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.parent is the wrong type.');
				});
			});

			it('should fail when trying to update with invalid title', function(){
				return Category.find(categories[0].id)
				.then(function(category){
					return category.update({title: true});
				})
				.then(function(){
                	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data.title is the wrong type.');
				});
			});

			it('should reject trying to update owner (to a valid owner)', function(){
				return Category.find(categories[0].id)
				.then(function(category){
					return category.update({owner: 2});
				})
				.then(function(){
                	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data has additional properties.');
				});
			});

			it('should reject trying to update id', function(){
				return Category.find(categories[0].id)
				.then(function(category){
					return category.update({id: 2});
				})
				.then(function(){
                	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
				})
				.catch(ValidationError, function(err){
					assert.equal(err.num, 1);
					assert.equal(err.message, '1 error: data has additional properties.');
				});
			});
		});

		it('should update a single field', function(){
			return Category.find(categories[0].id)
			.then(function(category){
				return category.update({title: "TestCat0002"});
			})
			.then(function(category){
				assert.equal(category.title, 'TestCat0002');
				assert.equal(category.owner, categories[0].owner);
				assert.equal(category.parent, categories[0].parent);
				assert.equal(category.id, categories[0].id);

				categories[0].title = 'TestCat0002';

				return knex('categories')
				.where('id', categories[0].id)
				.then(function(category2){
					assert.equal(category2[0].title, 	category.title);
					assert.equal(category2[0].owner, 	category.owner);
					assert.equal(category2[0].parent, 	category.parent);
					assert.equal(category2[0].id, 		category.id);
				});
			});
		});

		it.skip('should update multiple fields', function(){
			return Category.find(categories[0].id)
			.then(function(category){
				return category.update({title: "TestCat0003", parent: null });
			})
			.then(function(category2){
				assert.equal(category2.title, 'TestCat0002');
				assert.equal(category2.owner, 	categories[0].owner);
				assert.equal(category2.parent, 	categories[0].parent);
				assert.equal(category2.id, 		categories[0].id);

				categories[0].title = 'TestCat0002';

				return knex('categories')
				.where('id', categories[0].id)
				.then(function(category3){
					assert.equal(category3[0].title, 	category2.title);
					assert.equal(category3[0].owner, 	category2.owner);
					assert.equal(category3[0].parent, 	category2.parent);
					assert.equal(category3[0].id, 		category2.id);
				});
			});
		})

		it('should allow to be moved from root to sub category', function(){
			return Category.find(categories[0].id)
			.then(function(category){
				return category.update({parent: categories[1].id})
			})
			.then(function(category2){
				assert.equal(category2.title, 	categories[0].title);
				assert.equal(category2.owner, 	categories[0].owner);
				assert.equal(category2.id, 		categories[0].id);

				assert.equal(category2.parent, 	categories[1].id);

				return knex('categories')
				.where('id', categories[0].id)
				.then(function(category3){
					assert.equal(category3[0].title, 	category2.title);
					assert.equal(category3[0].owner, 	category2.owner);
					assert.equal(category3[0].parent, 	category2.parent);
					assert.equal(category3[0].id, 		category2.id);
				});
			});
		});

		it('should allow to be moved from sub category to root', function(){
			return Category.find(categories[0].id)
			.then(function(category){
				return category.update({parent: null})
			})
			.then(function(category2){
				assert.equal(category2.title, 	categories[0].title);
				assert.equal(category2.owner, 	categories[0].owner);
				assert.equal(category2.id, 		categories[0].id);

				assert.equal(category2.parent, 	null);

				return knex('categories')
				.where('id', categories[0].id)
				.then(function(category3){
					assert.equal(category3[0].title, 	category2.title);
					assert.equal(category3[0].owner, 	category2.owner);
					assert.equal(category3[0].parent, 	category2.parent);
					assert.equal(category3[0].id, 		category2.id);
				});
			});
		});

		it('should fail when trying to be moved to other user\'s category', function(){
			return Category.find(categories[0].id)
			.then(function(category){
				return category.update({parent: categories[2].id});
			})
			.then(function(category2){
               	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(UnauthorizedError, function(err){
				assert.equal(err.message, 'New parent has different owner');
			})
		})




		after(function(){
			return knex('categories').where('id', categories[0].id).del()
			.then(function(rows){ return knex('categories').where('id', categories[1].id).del() })
			.then(function(rows){ return knex('categories').where('id', categories[2].id).del() })
			.then(function(ids){
			})
		});
	});

	describe('#delete', function(){
		var categories = [
			{
				title: 'DELETE-TestCat0001',
				owner: 1,
				parent: null
			},
			{
				title: 'DELETE-TestChild0001',
				owner: 1,
			},
			{
				title: 'DELETE-TestChild0002',
				owner: 2,
			},
			{
				title: 'DELETE-TestCat0002',
				owner: 1,
				parent: null
			},
			{
				title: 'DELETE-TestCat0003',
				owner: 1,
				parent: null
			}
		]

		var passwords = [
			{
				parent 		: null,
				owner 		: 1,
				title 		: 'DELETE-PasswordChild0001',
				username 	: 'SomeUser1',
				password 	: 'AAAA==',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: 1,
				title 		: 'DELETE-PasswordChild0002',
				username 	: 'SomeUser2',
				password 	: 'AAAA==',
				url 		: null
			}
		]

		before(function(){
			return knex('categories').insert(categories[0])
			.then(function(ids){
				categories[0].id 	 = ids[0];
				categories[1].parent = ids[0];
				categories[2].parent = ids[0];
				return knex('categories').insert(categories[1]);
			})
			.then(function(ids){
				categories[1].id = ids[0];
				return knex('categories').insert(categories[2]);
			})
			.then(function(ids){
				categories[2].id = ids[0];
				return knex('categories').insert(categories[3]);
			})
			.then(function(ids){
				categories[3].id = ids[0];
				passwords[0].parent = ids[0];
				passwords[1].parent = ids[0];

				return knex('categories').insert(categories[4]);
			})
			.then(function(ids){
				categories[4].id = ids[0];
				return knex('passwords').insert(passwords[0]);
			})
			.then(function(ids){
				passwords[0].id = ids[0];
				return knex('passwords').insert(passwords[1]);
			})
			.then(function(ids){
				passwords[1].id = ids[0];
			});
		});

		it('should fail to delete category, with children categories attached', function(){
			Category.find(categories[0].id)
			.then(function(category){
				return category.del();
			})
			.then(function(res){
            	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');

			})
			.catch(SqlError, function(err){
				assert.equal(err.message, 'Category had attached children');
			});
		});

		it('should fail to delete category, with children passwords attached', function(){
			Category.find(categories[3].id)
			.then(function(category){
				return category.del();
			})
			.then(function(res){
            	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');

			})
			.catch(SqlError, function(err){
				assert.equal(err.message, 'Category had attached children');
			});
		});

		it('should fail, when trying to delete non-existant category', function(){
			var cat = new Category({
				id: 1337,
				title: 'evil haxxors',
				owner: 1,
				parent: null
			});

			return cat.del()
			.then(function(res){
            	assert.fail(undefined,undefined, 'Method succeeded, when it should have failed');
			})
			.catch(SqlError, function(err){
				assert.equal(err.message, 'Category was not found');
			})
		});

		it('should successfully delete a category', function(){
			Category.find(categories[4].id)
			.then(function(category){
				return category.del();
			})
		});
	



		
		after(function(){
			return knex('passwords').where('id', passwords[0].id).del()
			.then(function(){
				return knex('passwords').where('id', passwords[1].id).del();
			})
			.then(function(){
				// Should be deleted by Test later
				return knex('categories').where('id', categories[4].id).del();
			})
			.then(function(){
				return knex('categories').where('id', categories[3].id).del();
			})
			.then(function(){
				return knex('categories').where('id', categories[2].id).del();
			})
			.then(function(){
				return knex('categories').where('id', categories[1].id).del();
			})
			.then(function(){
				return knex('categories').where('id', categories[0].id).del();
			})
			.then(function(){});
		});
	});



});
