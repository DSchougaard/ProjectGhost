process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  

var _					= require('underscore');

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);

var knex = require(__base + 'database.js');

describe("API /categories", function(){

	/*
		Template User

		{
			username 	: 'Routes#Categories#GET#id-User1',
			isAdmin 	: false,
			salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
			password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
			privatekey 	: 'cGFzc3dvcmQ=',
			iv 			: 'cGFzc3dvcmQ=',
			pk_salt 	: 'cGFzc3dvcmQ=',
			publickey 	: 'cGFzc3dvcmQ='
		}
	*/


	/*
		Template Password

		{
			owner 		: null,
			parent 		: null,
			title 		: 'Routes#Categories#GET#id-User1-Password01',
			username 	: 'Routes#Categories#GET#id-User1-Password01-User',
			password 	: 'cGFzc3dvcmQ=',
			note 		: 'This is clearly a note!',
			url 		: null
		}
	*/


	/*
		Template Category

		{
			title  		: 'Routes#Categories#GET#Category0001',
			owner 		: 1,
			parent 		: null
		}
	*/


	describe('GET', function(){

		var users = {
			User1: {
				username 	: 'Routes#Categories#GET#id#User01',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			User2: {
				username 	: 'Routes#Categories#GET#id#User02',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			User3: {
				username 	: 'Routes#Categories#GET#id#User03',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			}
		};


		var categories = {
			User1: [
				{
					title  		: 'Routes#Categories#GET#Category0001',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#GET#Category0003',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#GET#Category0003',
					owner 		: 1,
					parent 		: null
				}	
			],
			User2: [
				{
					title  		: 'Routes#Categories#GET#Category0004',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#GET#Category0005',
					owner 		: 1,
					parent 		: null
				}	
			]
		}

		var tokens = {
			User1: undefined,
			User2: undefined,
			User3: undefined
		}

		// User1
		before(function(){
			var USER = 'User1';
			return knex('users')
			.insert(users[USER])
			.then(function(ids){
				users[USER].id = ids[0];
				categories[USER] = _.map(categories[USER], function(cat){  cat.owner = ids[0]; return cat; });

				var promises = [];

				for( var i = 0 ; i < categories[USER].length ; i++ ){
					promises.push( knex('categories').insert( categories[USER][i] ) );
				}
				return Promise.all(promises);
			})	
			.then(function(ids){
				for( var i = 0 ; i < ids.length ; i++ ){
					categories[USER][i].id = ids[i][0];
				}
			});
		});
		before(function(done){
			var USER = 'User1';

			server
			.post('/api/auth/login')
			.field('username', users[USER].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[USER] = res.body.token;
				return done();
			});
		});

		// User2
		before(function(){
			var USER = 'User2';
			return knex('users')
			.insert(users[USER])
			.then(function(ids){
				users[USER].id = ids[0];
				categories[USER] = _.map(categories[USER], function(cat){  cat.owner = ids[0]; return cat; });

				var promises = [];

				for( var i = 0 ; i < categories[USER].length ; i++ ){
					promises.push( knex('categories').insert( categories[USER][i] ) );
				}
				return Promise.all(promises);
			})	
			.then(function(ids){
				for( var i = 0 ; i < ids.length ; i++ ){
					categories[USER][i].id = ids[i][0];
				}
			});
		});

		// User3
		before(function(){
			var USER = 'User3';
			return knex('users')
			.insert(users[USER])
			.then(function(ids){
				users[USER].id = ids[0];
			});
		});
		before(function(done){
			var USER = 'User3';

			server
			.post('/api/auth/login')
			.field('username', users[USER].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[USER] = res.body.token;
				return done();
			});
		});
	

		it('should get all of a users categories', function(done){
			server
			.get('/api/users/'+users['User1'].id+'/categories')
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.deepEqual(res.body, categories['User1']);

				return done();
			});
		});	

		it('should return empty list when no categories are present', function(done){
			server
			.get('/api/users/'+users['User3'].id+'/categories')
			.set('Authorization', 'Bearer ' + tokens['User3'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.deepEqual(res.body, []);

				return done();
			});
		});

		it('should fail when trying to get categories for non-existant user', function(done){
			server
			.get('/api/users/'+ 1337 +'/categories')
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'User was not found');

				return done();
			});
		});

		it('should fail when tring to get categories for invalid user', function(done){
			server
			.get('/api/users/'+true+'/categories')
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ValidationError');

				return done();
			});		
		});

		it('should fail when tring to get categories for other user', function(done){
			server
			.get('/api/users/'+ users['User2'].id +'/categories')
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ForbiddenError');

				return done();
			});		

		});		

		after(function(){
			var promises = [];
			_.mapObject(users, function(val, key){
				_.each(categories[key], function(cat){
					promises.push( knex('categories').where('id', cat.id).del() );
				});

				promises.push( knex('users').where('id', val.id).del() );
			});

			return Promise.all(promises)
			.then(function(){ });
		});
	});

	describe.only('POST', function(){
		
		var users = {
			User1: {
				username 	: 'Routes#Categories#POST#id#User01',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			User2: {
				username 	: 'Routes#Categories#POST#id#User02',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			}
		};

		var categories = {
			User1: [
				{
					title  		: 'Routes#Categories#POST#Category0001',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#POST#Category0003',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#POST#Category0003',
					owner 		: 1,
					parent 		: null
				}	
			],
			User2: [
				{
					title  		: 'Routes#Categories#POST#Category0004',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#POST#Category0005',
					owner 		: 1,
					parent 		: null
				}	
			]
		}

		var tokens = {
			User1: undefined,
			User2: undefined
		}


		// User1
		before(function(){
			var USER = 'User1';
			return knex('users')
			.insert(users[USER])
			.then(function(ids){
				users[USER].id = ids[0];

				for( var i  = 0 ; i < categories[USER].length ; i++ ){
					categories[USER][i].owner = ids[0];
				}

				var promises = [];

				for( var i = 0 ; i < categories[USER].length ; i++ ){
					promises.push( knex('categories').insert( categories[USER][i] ) );
				}

				return Promise.all(promises);
			})	
			.then(function(ids){
				for( var i = 0 ; i < ids.length ; i++ ){
					categories[USER][i].id = ids[i][0];
				}
			});
		});
		before(function(done){
			var USER = 'User1';

			server
			.post('/api/auth/login')
			.field('username', users[USER].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[USER] = res.body.token;
				return done();
			});
		});

		// User2
		before(function(){
			var USER = 'User2';
			return knex('users')
			.insert(users[USER])
			.then(function(ids){
				users[USER].id = ids[0];

				for( var i  = 0 ; i < categories[USER].length ; i++ ){
					categories[USER][i].owner = ids[0];
				}

				var promises = [];

				for( var i = 0 ; i < categories[USER].length ; i++ ){
					promises.push( knex('categories').insert( categories[USER][i] ) );
				}
				return Promise.all(promises);
			})	
			.then(function(ids){
				for( var i = 0 ; i < ids.length ; i++ ){
					categories[USER][i].id = ids[i][0];
				}
			});
		});

		///////////////////////////////////////////////
		// Before's Done!
		///////////////////////////////////////////////


		it('should allow an user to create a new cateory in his root', function(done){
			var cat = {
				owner: users['User1'].id,
				title: 'Routes#Categories#POST#Category0010'
			}

			server
			.post('/api/users/'+users['User1'].id+'/categories')
			.send(cat)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(typeof res.body === 'number', true);
				cat.id = res.body;
				categories['User1'].push(cat);

				return done();
			});
		});

		it('should allow an user to create a new category, as a child to another category', function(done){
			var cat = {
				owner: users['User1'].id,
				parent: categories['User1'][0].id,
				title: 'Routes#Categories#POST#Category0011'
			}

			server
			.post('/api/users/'+users['User1'].id+'/categories')
			.send(cat)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(typeof res.body === 'number', true);
				cat.id = res.body;
				categories['User1'].push(cat);

				return done();
			});
		});

		it('should not allow an user to create a new category, in other user\'s root', function(done){
			var cat = {
				owner: users['User2'],
				title: 'Routes#Categories#POST#Category0021'
			}

			server
			.post('/api/users/'+users['User2'].id+'/categories')
			.send(cat)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});

		it('should not allow an user to create a new category, as a child to another user\'s category', function(done){
			var cat = {
				owner: users['User1'],
				title: 'Routes#Categories#POST#Category0021',
				parent: categories['User2'][0].id
			}

			server
			.post('/api/users/'+users['User1'].id+'/categories')
			.send(cat)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'BadRequestError');
				assert.equal(res.body.message, 'Parent category has other owner');

				return done();
			});
		});

		it('should not allow an user to create a new category, with another user as owner', function(done){
			var cat = {
				owner: users['User2'],
				title: 'Routes#Categories#POST#Category0021',
				parent: categories['User2'][0].id
			}

			server
			.post('/api/users/'+users['User2'].id+'/categories')
			.send(cat)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});

		describe('Missing Fields', function(){
			it('should throw an error, when the title field is missing', function(done){
				
				var cat = {
					owner: users['User1']
				}

				server
				.post('/api/users/'+users['User1'].id+'/categories')
				.send(cat)
				.set('Authorization', 'Bearer ' + tokens['User1'])
				.expect(400)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'ValidationError');

					return done();
				});
			});
		});

		describe('Wrongly Formatted Fields', function(){
			it('should return an error, when the parent field has the wrong type', function(done){
				
				var cat = {
					owner: users['User1'],
					title: 'Routes#Categories#POST#Category0022',
					parent: true
				}

				server
				.post('/api/users/'+users['User1'].id+'/categories')
				.send(cat)
				.set('Authorization', 'Bearer ' + tokens['User1'])
				.expect(400)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'ValidationError');

					return done();
				});

			});	

			it('should return an error, when the title field has the wrong type', function(done){
				var cat = {
					owner: users['User1'],
					title: true
				}

				server
				.post('/api/users/'+users['User1'].id+'/categories')
				.send(cat)
				.set('Authorization', 'Bearer ' + tokens['User1'])
				.expect(400)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'ValidationError');

					return done();
				});
			});	
		});
	
		after(function(){
			var promises = [];
			_.mapObject(users, function(val, key){

				for(var i = categories[key].length; i--;){		
					promises.push( knex('categories').where('id', categories[key][i].id).del() ) ;
				}

				promises.push( knex('users').where('id', val.id).del() );
			});

			return Promise.all(promises)
			.then(function(){ });
		});
	});

	describe('PUT', function(){
		before(function(){

		});

		it('should allow a user to change the title of a category he owns', function(done){
			return done();
		});

		it('should allow a user to change the parent of a category (w/o children) he owns, to another cateogry he owns', function(done){
			return done();
		});	

		it('should allow a user to change the parent of a category (w/ children) he owns, to another category he owns', function(done){
			return done();
		});		

		it('should not allow a user to change the ID of the category', function(done){
			return done();
		});		

		it('should not allow the user to change the owner of the category', function(done){
			return done();
		});	

		it('should not allow the user to update a category, owned by another user', function(done){
			return done();
		});	

		it('should return an error, when trying to update category which does not exist', function(done){
			return done();
		});	

		describe('Wrongly Formatted Fields', function(){
			it('should return an error, when the parent field has the wrong type', function(done){
				return done();
			});	

			it('should return an error, when the title field has the wrong type', function(done){
				return done();
			});	
		});

		after(function(){

		});	
	});

	describe('DEL', function(){
		before(function(){

		});

		it('should allow a user to delete a category (w/o children) he owns', function(done){
			return done();
		});		

		it('should not allow a user to delete a category, another user owns', function(done){
			return done();
		});	

		it('should not allow the user to delete a category w. children, that he owns', function(done){
			return done();
		});	

		it('should return an error, when trying to delete category which does not exist', function(done){
			return done();
		});	

		after(function(){

		});	
	});
});