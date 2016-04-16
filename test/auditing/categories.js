process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var _					= require('underscore');
var speakeasy		 	= require("speakeasy");

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);
var knex 				= require(__base + 'database.js');

describe('Categories', function(){
	
	function generateTemplateUser(username){
		return {
			username 	: 'Auditing#Categories#' + username,
			isAdmin 	: false,
			salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
			password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
			privatekey 	: 'cGFzc3dvcmQ=',
			iv 			: 'cGFzc3dvcmQ=',
			pk_salt 	: 'cGFzc3dvcmQ=',
			publickey 	: 'cGFzc3dvcmQ='
		};
	}

	function generateTemplateCategory(title){
		return {
			owner 		: undefined,
			parent 		: null,
			title 		: 'Auditing#Categories#'+title
		};
	}

	var userIds = [];

	describe('makes an audit entry when the category collection is retrieved', function(){
		
		var user  		= generateTemplateUser('User01');
		var passwords 	= [];
		var token 		=  undefined;

		var categories 	= [ generateTemplateCategory('Category01'), generateTemplateCategory('Category02'), generateTemplateCategory('Category03')];

		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);

					for( var i = 0 ; i < categories.length ; i++ ){
						categories[i].owner = ids[0];
					}
				});
			})

			before(function(){
				return knex('categories')
				.insert(categories)
				.then();
			});

			before(function(done){
				server
				.post('/api/auth/login')
				.field('username', user.username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					token = res.body.token;
					return done();
				});
			});

			// Flush audit log for ... Purposes	
			before(function(){
				return knex('audit')
				.del()
				.then();
			});
		}

		it('successfully completes api request', function(done){
			server
			.get('/api/users/'+user.id+'/categories')
			.set('Authorization', 'Bearer ' + token)
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'category collection' );
				assert.equal(rows[0].targetId, 		undefined);
				assert.equal(rows[0].action, 		1);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('makes an audit entry a category is deleted', function(){

		var user  		= generateTemplateUser('User02');
		var passwords 	= [];
		var token 		=  undefined;

		var category 	= generateTemplateCategory('Category04');

		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);

					category.owner = ids[0];
				});
			})

			before(function(){
				return knex('categories')
				.insert(category)
				.then(function(ids){
					category.id = ids[0];
				});
			});

			before(function(done){
				server
				.post('/api/auth/login')
				.field('username', user.username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					token = res.body.token;
					return done();
				});
			});

			// Flush audit log for ... Purposes	
			before(function(){
				return knex('audit')
				.del()
				.then();
			});
		}

		it('successfully completes api request', function(done){
			server
			.delete('/api/users/'+user.id+'/categories/'+category.id)
			.set('Authorization', 'Bearer ' + token)
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'category' );
				assert.equal(rows[0].targetId, 		category.id);
				assert.equal(rows[0].action, 		3);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('makes an audit entry when a category is updated', function(){
		
		var user  		= generateTemplateUser('User03');
		var passwords 	= [];
		var token 		=  undefined;

		var categories 	= [generateTemplateCategory('Category05'), generateTemplateCategory('Category06') ]

		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);

					for( var i = 0 ; i < categories.length ; i++ ){
						categories[i].owner = ids[0];
					}
				});
			})

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

			before(function(done){
				server
				.post('/api/auth/login')
				.field('username', user.username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					token = res.body.token;
					return done();
				});
			});

			// Flush audit log for ... Purposes	
			before(function(){
				return knex('audit')
				.del()
				.then();
			});
		}

		it('successfully completes api request', function(done){
			server
			.put('/api/users/'+user.id+'/categories/'+categories[0].id)
			.send({parent: categories[1].id})
			.set('Authorization', 'Bearer ' + token)
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'category' );
				assert.equal(rows[0].targetId, 		categories[0].id);
				assert.equal(rows[0].action, 		2);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('makes an audit entry when a category is created', function(){

		var user  		= generateTemplateUser('User04');
		var passwords 	= [];
		var token 		=  undefined;

		var category 	= generateTemplateCategory('Category07');

		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);

					category.owner = ids[0];
				});
			})

			before(function(done){
				server
				.post('/api/auth/login')
				.field('username', user.username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					token = res.body.token;
					return done();
				});
			});

			// Flush audit log for ... Purposes	
			before(function(){
				return knex('audit')
				.del()
				.then();
			});
		}

		it('successfully completes api request', function(done){
			server
			.post('/api/users/'+user.id+'/categories')
			.send(category)
			.set('Authorization', 'Bearer ' + token)
			.expect(function(res){
				category.id = res.body;
			})
			.expect(200, done);
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'category' );
				assert.equal(rows[0].targetId, 		category.id);
				assert.equal(rows[0].action, 		0);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	{
		after(function(){
			return knex('categories')
			.del()
			.whereIn('owner', userIds)
			.then();
		});

		after(function(){
			return knex('audit')
			.del()
			.then();
		});

		after(function(){
			return knex('users')
			.del()
			.whereIn('id', userIds);
		});
	}

});