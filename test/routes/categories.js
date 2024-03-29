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
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			User2: {
				username 	: 'Routes#Categories#GET#id#User02',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			User3: {
				username 	: 'Routes#Categories#GET#id#User03',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
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
					title  		: 'Routes#Categories#GET#Category0002',
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

				assert.equal(res.body.code, 'BadRequestError');

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
			return knex('audit')
			.del()
			.then();
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

	describe('POST', function(){
		
		var users = {
			User1: {
				username 	: 'Routes#Categories#POST#id#User01',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			User2: {
				username 	: 'Routes#Categories#POST#id#User02',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
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
					title  		: 'Routes#Categories#POST#Category0002',
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

					assert.equal(res.body.code, 'BadRequestError');

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

					assert.equal(res.body.code, 'BadRequestError');

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

					assert.equal(res.body.code, 'BadRequestError');

					return done();
				});
			});	
		});
		
		after(function(){
			return knex('audit')
			.del()
			.then();
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
		
		var users = {
			User1: {
				username 	: 'Routes#Categories#PUT#id#User01',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			User2: {
				username 	: 'Routes#Categories#PUT#id#User02',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			}
		};

		var categories = {
			User1: [
				{
					title  		: 'Routes#Categories#PUT#Category0001',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#PUT#Category0002',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#PUT#Category0003',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#PUT#Category0004',
					owner 		: 1,
					parent 		: null
				}
			],
			User2: [
				{
					title  		: 'Routes#Categories#PUT#Category0004',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#PUT#Category0005',
					owner 		: 1,
					parent 		: null
				}	
			]
		};

		var childCategories = {
			User1: [
				{
					title  		: 'Routes#Categories#PUT#ChildCategory0001',
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#PUT#ChildCategory0002',
					parent 		: null
				}
			]
		};

		var tokens = {
			User1: undefined,
			User2: undefined
		};


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
				childCategories[USER][0].parent = categories[USER][0].id;
				childCategories[USER][0].owner  = categories[USER][0].owner;

				childCategories[USER][1].parent = categories[USER][3].id;
				childCategories[USER][1].owner  = categories[USER][3].owner;

				var childPromises = [];

				for( var i = 0 ; i < childCategories[USER].length ; i++ ){
					childPromises.push( knex('categories').insert( childCategories[USER][i] ) );
				}
				return Promise.all(childPromises);
			})
			.then(function(ids){
				for( var i = 0 ; i < ids.length ; i++ ){
					childCategories[USER][i].id = ids[i][0];
				}
			})
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

		it('should allow a user to change the title of a category he owns', function(done){
			var update = {
				title: 'Routes#Categories#PUT#Category0001-Updated'
			}

			server
			.put('/api/users/'+users['User1'].id+'/categories/'+categories['User1'][0].id)
			.send(update)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body, 'OK');
				categories['User1'][0].title = update.title;

				return done();
			});
		});

		it('should allow a user to change the parent of a category (w/o children) he owns, to another cateogry he owns', function(done){
			// Category0002 to child of Category0003

			var update = {
				parent: categories['User1'][2].id
			}

			server
			.put('/api/users/'+users['User1'].id+'/categories/'+categories['User1'][1].id)
			.send(update)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body, 'OK');
				categories['User1'][1].parent = update.parent;
				childCategories['User1'].push(categories['User1'][1]);

				return done();
			});
		});	

		it('should allow a user to change the parent of a category (w/ children) he owns, to another category he owns', function(done){
			// Category0001 to child of Category0003
			
			var update = {
				parent: categories['User1'][2].id
			}

			server
			.put('/api/users/'+users['User1'].id+'/categories/'+categories['User1'][0].id)
			.send(update)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body, 'OK');
				categories['User1'][0].parent = update.parent;
				childCategories['User1'].push(categories['User1'][0]);

				return done();
			});
		});		

		it('should allow a user to change the parent of a category to the root', function(done){
			// ChildCategory0002 from child of Category0004, to child of root
			
			var update = {
				parent: null
			}

			server
			.put('/api/users/'+users['User1'].id+'/categories/'+childCategories['User1'][1].id)
			.send(update)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body, 'OK');
				childCategories['User1'][1].parent = null;

				return done();
			});
		});		

		it('should not allow a user to change the ID of the category', function(done){
			var update = {
				id: 1337
			}

			server
			.put('/api/users/'+users['User1'].id+'/categories/'+categories['User1'][0].id)
			.send(update)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'BadRequestError');
				assert.equal(res.body.errors.length, 1);

				assert.equal(res.body.errors[0].field, 'data');
				assert.equal(res.body.errors[0].error, 'has additional properties');

				return done();
			});
		});		

		it('should not allow the user to change the owner of the category', function(done){
			var update = {
				owner: users['User2'].id
			}

			server
			.put('/api/users/'+users['User1'].id+'/categories/'+categories['User1'][0].id)
			.send(update)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'BadRequestError');
				assert.equal(res.body.errors.length, 1);

				assert.equal(res.body.errors[0].field, 'data');
				assert.equal(res.body.errors[0].error, 'has additional properties');

				return done();
			});
		});	

		it('should not allow the user to update a category, owned by another user', function(done){
			var update = {
				title: 'Categories#PUT#Category0020'
			}

			server
			.put('/api/users/'+users['User1'].id+'/categories/'+categories['User2'][0].id)
			.send(update)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ForbiddenError');
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});	

		it('should return an error, when trying to update category which does not exist', function(done){
			var update = {
				title: 'Categories#PUT#Category0020'
			}

			server
			.put('/api/users/'+users['User1'].id+'/categories/' + 1337)
			.send(update)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'NotFoundError');
				assert.equal(res.body.message, 'Category was not found');

				return done();
			});		
		});	

		describe('Wrongly Formatted Fields', function(){
			it('should return an error, when the parent field has the wrong type', function(done){
				var update = {
					parent: true
				}

				server
				.put('/api/users/'+users['User1'].id+'/categories/'+categories['User1'][0].id )
				.send(update)
				.set('Authorization', 'Bearer ' + tokens['User1'])
				//.expect(400)
				.end(function(err, res){
					if(err) return done(err);
					
					assert.equal(res.body.code, 'BadRequestError');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'parent');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});			
			});	

			it('should return an error, when the title field has the wrong type', function(done){
				var update = {
					title: true
				}

				server
				.put('/api/users/'+users['User1'].id+'/categories/'+categories['User1'][0].id )
				.send(update)
				.set('Authorization', 'Bearer ' + tokens['User1'])
				//.expect(400)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.code, 'BadRequestError');
					assert.equal(res.body.errors.length, 1);
					assert.equal(res.body.errors[0].field, 'title');
					assert.equal(res.body.errors[0].error, 'is the wrong type');

					return done();
				});		
			});
		});

		after(function(){
			return knex('audit')
			.del()
			.then();
		});

		after(function(){
			var promises = [];
			_.mapObject(users, function(val, key){

				if(childCategories[key] !== undefined ){
					for( var i = 0 ; i < childCategories[key].length; i++){
						promises.push( knex('categories').where('id', childCategories[key][i].id).del() ) ;
					}
				}

				for(var i = categories[key].length; i--;){		
					promises.push( knex('categories').where('id', categories[key][i].id).del() ) ;
				}

				promises.push( knex('users').where('id', val.id).del() );
			});

			return Promise.all(promises)
			.then(function(){ });
		});


	});

	describe('DEL', function(){
		var users = {
			User1: {
				username 	: 'Routes#Categories#DELETE#id#User01',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			},
			User2: {
				username 	: 'Routes#Categories#DELETE#id#User02',
				isAdmin 	: false,
				salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
				password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
				privatekey 	: 'cGFzc3dvcmQ=',
				iv 			: 'cGFzc3dvcmQ=',
				pk_salt 	: 'cGFzc3dvcmQ=',
				publickey 	: 'cGFzc3dvcmQ='
			}
		};

		var categories = {
			User1: [
				{
					title  		: 'Routes#Categories#DELETE#Category0001',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#DELETE#Category0002',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#DELETE#Category0003',
					owner 		: 1,
					parent 		: null
				},
			],
			User2: [
				{
					title  		: 'Routes#Categories#DELETE#Category0004',
					owner 		: 1,
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#DELETE#Category0005',
					owner 		: 1,
					parent 		: null
				}	
			]
		};

		var childCategories = {
			User1: [
				{
					title  		: 'Routes#Categories#DELETE#ChildCategory0001',
					parent 		: null
				},
				{
					title  		: 'Routes#Categories#DELETE#ChildCategory0002',
					parent 		: null
				}
			]
		};

		var passwords = {
			User1: [
				{
					parent 		: null,
					owner 		: 1,
					title 		: 'Routes#Categories#DELETE#PasswordChild0001',
					username 	: 'SomeUser1',
					password 	: 'AAAA==',
					note 		: 'This is clearly a note!',
					url 		: null
				},
				{
					parent 		: null,
					owner 		: 1,
					title 		: 'Routes#Categories#DELETE#PasswordChild0002',
					username 	: 'SomeUser2',
					password 	: 'AAAA==',
					url 		: null
				}
			]
		}

		var tokens = {
			User1: undefined,
			User2: undefined
		};


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

				var promises = [];

				for( var i = 0 ; i < childCategories[USER].length ; i++ ){
					childCategories[USER][i].parent = categories[USER][1].id;
					childCategories[USER][i].owner  = categories[USER][1].owner;

					promises.push( knex('categories').insert( childCategories[USER][i] ) );
				}

				return Promise.all(promises);
			})
			.then(function(ids){
				for( var i = 0 ; i < ids.length ; i++ ){
					childCategories[USER][i].id = ids[i][0];
				}

				var promises = [];

				for( var i = 0 ; i < passwords[USER].length ; i++ ){
					passwords[USER][i].owner  = users[USER].id;
					passwords[USER][i].parent = categories[USER][2].id;

					promises.push( knex('passwords').insert(passwords[USER][i]));
				}
				return Promise.all(promises);
			})
			.then(function(ids){
				for( var i = 0 ; i < ids.length ; i++ ){
					passwords[USER][i].id = ids[i][0];
				}
				return;
			})
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
				return;
			});
		});

		///////////////////////////////////////////////
		// Before's Done!
		///////////////////////////////////////////////
		it('should allow a user to delete a category (w/o children) he owns', function(done){
			// Index = 0;
			server
			.del('/api/users/'+users['User1'].id+'/categories/' + categories['User1'][0].id)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body, 'OK');

				return done();
			});		
		});		

		it('should not allow the user to delete a category w. category children, that he owns', function(done){
			// Index = 1;
			server
			.del('/api/users/'+users['User1'].id+'/categories/' + categories['User1'][1].id)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			//.expect(409)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ConflictError');
				assert.equal(res.body.message, 'Category had attached children');

				return done();
			});		
		});	

		it('should not allow the user to delete a category w. password children, that he owns', function(done){
			// Index = 2;
			server
			.del('/api/users/'+users['User1'].id+'/categories/' + categories['User1'][2].id)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			//.expect(409)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ConflictError');
				assert.equal(res.body.message, 'Category had attached children');

				return done();
			});	
		});	

		it('should return an error, when trying to delete category which does not exist', function(done){
			server
			.del('/api/users/'+users['User1'].id+'/categories/' + 1337)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			.expect(404)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'NotFoundError');

				return done();
			});	
		});	

		it('should not allow a user to delete a category, another user owns', function(done){
			server
			.del('/api/users/'+users['User1'].id+'/categories/' + categories['User2'][0].id)
			.set('Authorization', 'Bearer ' + tokens['User1'])
			//.expect(403)
			.end(function(err, res){
				if(err) return done(err);

				assert.equal(res.body.code, 'ForbiddenError');

				return done();
			});	
		});	

		after(function(){
			return knex('audit')
			.del()
			.then();
		});

		after(function(){
			return knex('passwords')
			.where('title',  			passwords['User1'][0].title)
			.orWhere('title',			passwords['User1'][1].title)
			.del()
			.then(function(){
				return knex('categories')
				.where('title',  		childCategories['User1'][0].title)
				.orWhere('title',  		childCategories['User1'][1].title)
				.orWhere('title', 		categories['User1'][0].title)
				.orWhere('title', 		categories['User1'][1].title)
				.orWhere('title', 		categories['User1'][2].title)
				.orWhere('title', 		categories['User2'][0].title)
				.orWhere('title', 		categories['User2'][1].title)
				.del();
			})
			.then(function(){
				return knex('users')
				.where('username',  	'Routes#Categories#DELETE#id#User01')
				.orWhere('username', 	'Routes#Categories#DELETE#id#User02')
				.del();
			})
			.then(function(){
				
			})
			.catch(function(err){
				console.log(err);
			})
		});	
	});
});