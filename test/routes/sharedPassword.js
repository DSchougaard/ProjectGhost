process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var _					= require('underscore');

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);
var knex 				= require(__base + 'database.js');
	
describe.only("API Shared Passwords", function(){
	
	/*
			var tokens = [undefined, undefined];
		before(function(done){
			// Obtain auth token -- admin
			server
			.post('/api/auth/login')
			.field('username', users[0].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[0] = res.body.token;
				return done();
			});
		});
		before(function(done){
			// Obtain auth token -- admin
			server
			.post('/api/auth/login')
			.field('username', users[1].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err); 
				tokens[1] = res.body.token;
				return done();
			});
		});

	*/

	/*
	describe.skip('#findSharedFromMe', function(){
		var users = [
			{
				username: 'Routes#SharedPassword#findSharedFromMe-User01',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			},
			{
				username: 'Routes#SharedPassword#findSharedFromMe-User02',
				isAdmin: false,
				salt: 'cGFzc3dvcmQ=',
				password: 'cGFzc3dvcmQ=',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			}
		];

		before(function(){
			return knex
			.insert(users[0])
			.into('users')
			.then(function(id){
				users[0].id = id[0];

				passwords[users[0].username][0].owner = id[0];
				passwords[users[0].username][1].owner = id[0];
				passwords[users[0].username][2].owner = id[0];

			});
		})

		before(function(){
			return knex
			.insert(users[1])
			.into('users')
			.then(function(id){
				users[1].id = id[0];

				passwords[users[1].username][0].owner = id[0];
				passwords[users[1].username][1].owner = id[0];
				passwords[users[1].username][2].owner = id[0];

			});
		})

		var passwords = {};
		passwords[users[0].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#findSharedFromMe-Title001',
				username 	: 'Routes#SharedPassword#findSharedFromMe-User001',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#findSharedFromMe-Title002',
				username 	: 'Routes#SharedPassword#findSharedFromMe-User002',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#findSharedFromMe-Title003',
				username 	: 'Routes#SharedPassword#findSharedFromMe-User003',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		passwords[users[1].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#findSharedFromMe-Title011',
				username 	: 'Routes#SharedPassword#findSharedFromMe-User011',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#findSharedFromMe-Title012',
				username 	: 'Routes#SharedPassword#findSharedFromMe-User012',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#findSharedFromMe-Title013',
				username 	: 'Routes#SharedPassword#findSharedFromMe-User013',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		// User[0] passwords
		before(function(){
			var password = passwords[users[0].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});

		// User[1] passwords
		before(function(){
			var password = passwords[users[1].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});

		var sharedPasswords = [
		]

		// Create shares from User[0] -> User[1]
		before(function(){
			return knex
			.insert({
				owner: users[1].id,
				origin_owner: users[0].id,
				parent: null,
				origin_password: passwords[users[0].username][0].id,
				password: 'c29tZW90aGVycGFzc3dvcmQ='
			})
			.into('shared_passwords')
			.then( );
		});
		before(function(){
			return knex
			.insert({
				owner: users[1].id,
				origin_owner: users[0].id,
				parent: null,
				origin_password: passwords[users[0].username][2].id,
				password: 'c29tZW90aGVycGFzc3dvcmQ='
			})
			.into('shared_passwords')
			.then( );
		});

		var tokens = [undefined, undefined];
		before(function(done){
			// Obtain auth token -- admin
			server
			.post('/api/auth/login')
			.field('username', users[0].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[0] = res.body.token;
				return done();
			});
		});
		before(function(done){
			// Obtain auth token -- admin
			server
			.post('/api/auth/login')
			.field('username', users[1].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[1] = res.body.token;
				return done();
			});
		});



		it('returns returns a list of passwords a user has shared with another user', function(){
			server
			.get('/api/users/'+idAuthToken+'/passwords/' + testID)
			.set('Authorization', 'Bearer ' + authToken)
			.expect(200)
			.end(function(err, res){



			return User.find(users[0].id)
			.then(function(user){
				return SharedPassword.findSharedFromMe(user);

			})
			.then(function(sharedPasswords){
				assert.equal(sharedPasswords.length, 2);

				var _passwords = passwords[users[0].username]

				// SharedPassword[0]
				// Origin Values
				assert.equal(sharedPasswords[0].origin_owner, 	users[0].id)
				assert.equal(sharedPasswords[0].origin_password,_passwords[0].id);

				// Inherited from Origin
				//assert.equal(sharedPasswords[0].title, 			_passwords[0].title);
				//assert.equal(sharedPasswords[0].username,		_passwords[0].username);
				//assert.equal(sharedPasswords[0].url, 			_passwords[0].url);
				//assert.equal(sharedPasswords[0].note, 			_passwords[0].note);

				// User Shared To
				assert.equal(sharedPasswords[0].owner, 			users[1].id);
				assert.equal(sharedPasswords[0].parent,			null);
				assert.notEqual(sharedPasswords[0].password,	users[1].password);

				// SharedPassword[1]
				// Origin Values
				assert.equal(sharedPasswords[1].origin_owner, 	users[0].id)
				assert.equal(sharedPasswords[1].origin_password,_passwords[2].id);

				// Inherited from Origin
				//assert.equal(sharedPasswords[1].title, 			_passwords[0].title);
				//assert.equal(sharedPasswords[1].username,			_passwords[0].username);
				//assert.equal(sharedPasswords[1].url, 				_passwords[0].url);
				//assert.equal(sharedPasswords[1].note, 			_passwords[0].note);

				// User Shared To
				assert.equal(sharedPasswords[0].owner, 			users[1].id);
				assert.equal(sharedPasswords[0].parent,			null);
				assert.notEqual(sharedPasswords[0].password,	users[1].password);

				return;
			});
		});

		it('returns an empty list, when the user has not shared any passwords', function(){
			return User.find(users[1].id)
			.then(SharedPassword.findSharedFromMe)
			.then(function(sharedPasswords){
				assert.equal(sharedPasswords.length, 0);
			});
		});

		
		after(function(){
			return knex
			.del()
			.from('shared_passwords')
			.where('origin_owner', users[0].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('passwords')
			.where('owner', users[0].id)
			.orWhere('owner', users[1].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('users')
			.where('id', users[0].id)
			.orWhere('id', users[1].id)
			.then();
		});
	});
	*/

	describe('#findSharedToMe', function(){
		var users = [
			{
				username: 'Routes#SharedPassword#FindSharedToMe-User01',
				isAdmin: false,
				password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
				salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			},
			{
				username: 'Routes#SharedPassword#FindSharedToMe-User02',
				isAdmin: false,
				password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
				salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
				privatekey: 'cGFzc3dvcmQ=',
				iv: 'cGFzc3dvcmQ=',
				pk_salt: 'cGFzc3dvcmQ=',
				publickey: 'cGFzc3dvcmQ='
			}
		];

		before(function(){
			return knex
			.insert(users[0])
			.into('users')
			.then(function(id){
				users[0].id = id[0];

				passwords[users[0].username][0].owner = id[0];
				passwords[users[0].username][1].owner = id[0];
				passwords[users[0].username][2].owner = id[0];

			});
		})

		before(function(){
			return knex
			.insert(users[1])
			.into('users')
			.then(function(id){
				users[1].id = id[0];

				passwords[users[1].username][0].owner = id[0];
				passwords[users[1].username][1].owner = id[0];
				passwords[users[1].username][2].owner = id[0];

			});
		})

		var passwords = {};
		passwords[users[0].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#FindSharedToMe-Title001',
				username 	: 'Routes#SharedPassword#FindSharedToMe-User001',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#FindSharedToMe-Title002',
				username 	: 'Routes#SharedPassword#FindSharedToMe-User002',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#FindSharedToMe-Title003',
				username 	: 'Routes#SharedPassword#FindSharedToMe-User003',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		passwords[users[1].username] = [
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#FindSharedToMe-Title011',
				username 	: 'Routes#SharedPassword#FindSharedToMe-User011',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#FindSharedToMe-Title012',
				username 	: 'Routes#SharedPassword#FindSharedToMe-User012',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			},
			{
				parent 		: null,
				owner 		: null,
				title 		: 'Routes#SharedPassword#FindSharedToMe-Title013',
				username 	: 'Routes#SharedPassword#FindSharedToMe-User013',
				password 	: 'cGFzc3dvcmQ=',
				note 		: 'This is clearly a note!',
				url 		: null
			}
		];

		// User[0] passwords
		before(function(){
			var password = passwords[users[0].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[0].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});

		// User[1] passwords
		before(function(){
			var password = passwords[users[1].username][0];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][1];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});
		before(function(){
			var password = passwords[users[1].username][2];
			return knex
			.insert(password)
			.into('passwords')
			.then(function(ids){
				password.id = ids[0];
			});
		});


		// Create shares from User[0] -> User[1]
		before(function(){
			return knex
			.insert({
				owner: users[1].id,
				origin_owner: users[0].id,
				parent: null,
				origin_password: passwords[users[0].username][0].id,
				password: 'c29tZW90aGVycGFzc3dvcmQ='
			})
			.into('shared_passwords')
			.then( );
		});
		before(function(){
			return knex
			.insert({
				owner: users[1].id,
				origin_owner: users[0].id,
				parent: null,
				origin_password: passwords[users[0].username][2].id,
				password: 'c29tZW90aGVycGFzc3dvcmQ='
			})
			.into('shared_passwords')
			.then( );
		});
		
		var tokens = [undefined, undefined];
		before(function(done){
			// Obtain auth token -- admin
			server
			.post('/api/auth/login')
			.field('username', users[0].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[0] = res.body.token;
				return done();
			});
		});
		before(function(done){
			// Obtain auth token -- admin
			server
			.post('/api/auth/login')
			.field('username', users[1].username)
			.field('password', 'password')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				tokens[1] = res.body.token;
				return done();
			});
		});


		it('returns a list of shared passwords, WITH inherited values', function(done){
			server
			.get('/api/users/'+ users[1].id+'/passwords/shares')
			.set('Authorization', 'Bearer ' + tokens[1])
			.expect(200)
			.end(function(err, res){

				var sharedPasswords = res.body;

				assert.equal(sharedPasswords.length, 2);

				var _passwords = passwords[users[0].username]

				// SharedPassword[0]
				// Origin Values
				assert.equal(sharedPasswords[0].origin_owner, 	 	users[0].id)
				assert.equal(sharedPasswords[0].origin_password, 	_passwords[0].id);

				// Inherited from Origin
				assert.equal(sharedPasswords[0].title, 				_passwords[0].title);
				assert.equal(sharedPasswords[0].username,			_passwords[0].username);
				assert.equal(sharedPasswords[0].url, 				_passwords[0].url);
				assert.equal(sharedPasswords[0].note, 				_passwords[0].note);

				// User Shared To
				assert.equal(sharedPasswords[0].owner, 				users[1].id);
				assert.equal(sharedPasswords[0].parent,				null);
				assert.notEqual(sharedPasswords[0].password,		_passwords[0].password);

				// SharedPassword[1]
				// Origin Values
				assert.equal(sharedPasswords[1].origin_owner, 		users[0].id)
				assert.equal(sharedPasswords[1].origin_password,	_passwords[2].id);

				// Inherited from Origin
				assert.equal(sharedPasswords[1].title, 				_passwords[2].title);
				assert.equal(sharedPasswords[1].username,			_passwords[2].username);
				assert.equal(sharedPasswords[1].url, 				_passwords[2].url);
				assert.equal(sharedPasswords[1].note, 				_passwords[2].note);

				// User Shared To
				assert.equal(sharedPasswords[0].owner, 				users[1].id);
				assert.equal(sharedPasswords[0].parent,				null);
				assert.notEqual(sharedPasswords[0].password,		_passwords[2].password);

				return done();
			});
		});

		it('returns an empty list, when the user has not been shared any passwords', function(done){
			server
			.get('/api/users/'+ users[0].id+'/passwords/shares')
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(200)
			.end(function(err, res){
				assert.equal(res.body.length, 0);
				return done();
			});
		});

		it('returns an erorr when trying to get another users shared passwords', function(done){
			server
			.get('/api/users/'+ users[1].id+'/passwords/shares')
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(403)
			.end(function(err, res){

				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});


		after(function(){
			return knex
			.del()
			.from('audit')
			.where('userId', users[0].id)
			.orWhere('userId', users[1].id)
			.then();
		})

		after(function(){
			return knex
			.del()
			.from('shared_passwords')
			.where('origin_owner', users[0].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('passwords')
			.where('owner', users[0].id)
			.orWhere('owner', users[1].id)
			.then();
		});

		after(function(){
			return knex
			.del()
			.from('users')
			.where('id', users[0].id)
			.orWhere('id', users[1].id)
			.then();
		});
	});

	describe('#create', function(){
		{
			var users = [
				{
					username 	: 'Routes#SharedPassword#Create-User01',
					isAdmin 	: false,
					password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
					salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
					privatekey 	: 'cGFzc3dvcmQ=',
					iv 			: 'cGFzc3dvcmQ=',
					pk_salt		: 'cGFzc3dvcmQ=',
					publickey 	: 'cGFzc3dvcmQ='
				},
				{
					username 	: 'Routes#SharedPassword#Create-User02',
					isAdmin 	: false,
					password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
					salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
					privatekey 	: 'cGFzc3dvcmQ=',
					iv 			: 'cGFzc3dvcmQ=',
					pk_salt		: 'cGFzc3dvcmQ=',
					publickey 	: 'cGFzc3dvcmQ='
				},
				{
					username 	: 'Routes#SharedPassword#Create-User03',
					isAdmin 	: false,
					password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
					salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
					privatekey 	: 'cGFzc3dvcmQ=',
					iv 			: 'cGFzc3dvcmQ=',
					pk_salt 	: 'cGFzc3dvcmQ=',
					publickey 	: 'cGFzc3dvcmQ='
				}
			];

			before(function(){
				return knex
				.insert(users[0])
				.into('users')
				.then(function(id){
					users[0].id = id[0];

					passwords[users[0].username][0].owner = id[0];
					passwords[users[0].username][1].owner = id[0];
					passwords[users[0].username][2].owner = id[0];

				});
			})

			before(function(){
				return knex
				.insert(users[1])
				.into('users')
				.then(function(id){
					users[1].id = id[0];

					passwords[users[1].username][0].owner = id[0];
					passwords[users[1].username][1].owner = id[0];
					passwords[users[1].username][2].owner = id[0];

				});
			});

			before(function(){
				return knex
				.insert(users[2])
				.into('users')
				.then(function(id){
					users[1].id = id[0];
				});
			})

			var passwords = {};
			passwords[users[0].username] = [
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Create-Title001',
					username 	: 'Routes#SharedPassword#Create-User001',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				},
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Create-Title002',
					username 	: 'Routes#SharedPassword#Create-User002',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				},
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Create-Title003',
					username 	: 'Routes#SharedPassword#Create-User003',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				}
			];

			passwords[users[1].username] = [
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Create-Title011',
					username 	: 'Routes#SharedPassword#Create-User011',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				},
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Create-Title012',
					username 	: 'Routes#SharedPassword#Create-User012',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				},
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Create-Title013',
					username 	: 'Routes#SharedPassword#Create-User013',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				}
			];

			// User[0] passwords
			before(function(){
				var password = passwords[users[0].username][0];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});
			before(function(){
				var password = passwords[users[0].username][1];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});
			before(function(){
				var password = passwords[users[0].username][2];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});

		
			// User[1] passwords
			before(function(){
				var password = passwords[users[1].username][0];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});
			before(function(){
				var password = passwords[users[1].username][1];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});
			before(function(){
				var password = passwords[users[1].username][2];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});


			var tokens = [undefined, undefined];
			before(function(done){
				// Obtain auth token -- admin
				server
				.post('/api/auth/login')
				.field('username', users[0].username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					tokens[0] = res.body.token;
					return done();
				});
			});
			before(function(done){
				// Obtain auth token -- admin
				server
				.post('/api/auth/login')
				.field('username', users[1].username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					tokens[1] = res.body.token;
					return done();
				});
			});
		}

		describe('Fails due to json invalidity', function(){
			it('throws an error when the password is invalid', function(done){
				var payload = {
					owner: users[1].id, 
					password: true,
				};

				server
				.post('/api/users/'+ users[0].id+'/passwords/'+passwords[users[0].username][0].id+'/shares')
				.send(payload)
				.set('Authorization', 'Bearer ' + tokens[0])
				.expect(400)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.message, 'Validation error');

					return done();
				});
			});

			it('throws an error when the owner is invalid', function(done){
				var payload = {
					owner: true, 
					password: 'c29tZW90aGVycGFzc3dvcmQ=',
				};

				server
				.post('/api/users/'+ users[0].id+'/passwords/'+passwords[users[0].username][0].id+'/shares')
				.send(payload)
				.set('Authorization', 'Bearer ' + tokens[0])
				.expect(400)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.message, 'Validation error');

					return done();
				});
			});
		});

		describe('Pattern Mismatch', function(){
			it('throws an error when the model has invalid password', function(done){
				var payload = {
					owner: users[1].id, 
					password: 'c29tZW90aGVycGFzc3dvcmQ',
				};

				server
				.post('/api/users/'+ users[0].id+'/passwords/'+passwords[users[0].username][0].id+'/shares')
				.send(payload)
				.set('Authorization', 'Bearer ' + tokens[0])
				.expect(400)
				.end(function(err, res){
					if(err) return done(err);

					assert.equal(res.body.message, 'Validation error');

					return done();
				});
			});
		});

		describe('Fails due to non-existant references', function(){
			it('fails to create shared password of non-existant password', function(done){
				var payload = {
					owner: users[1].id, 
					password: 'c29tZW90aGVycGFzc3dvcmQ=',
				};

				server
				.post('/api/users/'+ users[0].id+'/passwords/1337/shares')
				.send(payload)
				.set('Authorization', 'Bearer ' + tokens[0])
				.expect(function(res){
					assert.equal(res.body.message, 'Password was not found');
				})
				.expect(404, done);
			});

			it('fails to create shared password, when the target user is non-existant', function(done){
				var payload = {
					owner: 1337, 
					password: 'c29tZW90aGVycGFzc3dvcmQ=',
				};

				server
				.post('/api/users/'+ users[0].id+'/passwords/'+passwords[users[0].username][0].id+'/shares')
				.send(payload)
				.set('Authorization', 'Bearer ' + tokens[0])
				.expect(function(res){
					assert.equal(res.body.message, 'User ID 1337 was not found');
				})
				.expect(404, done);
			});

			it('fails to create shared password, when the source user is non-existant', function(done){
				var payload = {
					owner: users[1].id, 
					password: 'c29tZW90aGVycGFzc3dvcmQ=',
				};

				server
				.post('/api/users/1337/passwords/'+passwords[users[0].username][0].id+'/shares')
				.send(payload)
				.set('Authorization', 'Bearer ' + tokens[0])
				.expect(function(res){
					assert.equal(res.body.message, 'User was not found');
				})
				.expect(404, done);
			});	
		});

		it('a user should not be allowed to share another users password to himself', function(done){
			// User 0 tries to share User 1's password to himself
			var payload = {
				owner: users[0].id, 
				password: 'c29tZW90aGVycGFzc3dvcmQ=',
			};

			server
			.post('/api/users/'+ users[1].id+'/passwords/'+passwords[users[0].username][0].id+'/shares')
			.send(payload)
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(function(res){
				assert.equal(res.body.message, 'Insufficient privileges');
			})
			.expect(403, done);
		});

		it('a user should not be allowed to share another users password to a third user', function(done){
			// User 0 tries to share User 1's password to User 2
			var payload = {
				owner: users[2].id, 
				password: 'c29tZW90aGVycGFzc3dvcmQ=',
			};

			server
			.post('/api/users/'+ users[1].id+'/passwords/'+passwords[users[0].username][0].id+'/shares')
			.send(payload)
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(403)
			.end(function(err, res){
				if(err) return done(err);
			
				assert.equal(res.body.message, 'Insufficient privileges');

				return done();
			});
		});

		it('successfully creates a shared password', function(done){
			// Shares from User 0 to User 1
			var payload = {
				owner: users[1].id,
				password: 'c29tZW90aGVycGFzc3dvcmQ=',
			}

			server
			.post('/api/users/'+ users[0].id+'/passwords/'+passwords[users[0].username][0].id+'/shares')
			.send(payload)
			.set('Authorization', 'Bearer ' + tokens[0])
			//.expect(403)
			.end(function(err, res){
				if(err) return done(err);
				
				assert.equal(res.body.owner, users[1].id);
				assert.equal(res.body.origin_owner, users[0].id);

				assert.equal(res.body.password, 'c29tZW90aGVycGFzc3dvcmQ=');
				assert.equal(res.body.origin_password, passwords[users[0].username][0].id);

				return done();
			});	
		});


	});

	describe('#del', function(){

		{

			var users = [
				{
					username: 'Routes#SharedPassword#Delete-User01',
					isAdmin: false,
					password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
					salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
					privatekey: 'cGFzc3dvcmQ=',
					iv: 'cGFzc3dvcmQ=',
					pk_salt: 'cGFzc3dvcmQ=',
					publickey: 'cGFzc3dvcmQ='
				},
				{
					username: 'Routes#SharedPassword#Delete-User02',
					isAdmin: false,
					password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
					salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
					privatekey: 'cGFzc3dvcmQ=',
					iv: 'cGFzc3dvcmQ=',
					pk_salt: 'cGFzc3dvcmQ=',
					publickey: 'cGFzc3dvcmQ='
				}
			];
			before(function(){
				return knex
				.insert(users[0])
				.into('users')
				.then(function(id){
					users[0].id = id[0];

					passwords[users[0].username][0].owner = id[0];
					passwords[users[0].username][1].owner = id[0];
					passwords[users[0].username][2].owner = id[0];

				});
			});

			before(function(){
				return knex
				.insert(users[1])
				.into('users')
				.then(function(id){
					users[1].id = id[0];

					passwords[users[1].username][0].owner = id[0];
					passwords[users[1].username][1].owner = id[0];
					passwords[users[1].username][2].owner = id[0];

				});
			});


			var passwords = {};
			passwords[users[0].username] = [
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Delete-Title001',
					username 	: 'Routes#SharedPassword#Delete-User001',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				},
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Delete-Title002',
					username 	: 'Routes#SharedPassword#Delete-User002',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				},
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Delete-Title003',
					username 	: 'Routes#SharedPassword#Delete-User003',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				}
			];

			passwords[users[1].username] = [
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Delete-Title011',
					username 	: 'Routes#SharedPassword#Delete-User011',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				},
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Delete-Title012',
					username 	: 'Routes#SharedPassword#Delete-User012',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				},
				{
					parent 		: null,
					owner 		: null,
					title 		: 'Routes#SharedPassword#Delete-Title013',
					username 	: 'Routes#SharedPassword#Delete-User013',
					password 	: 'cGFzc3dvcmQ=',
					note 		: 'This is clearly a note!',
					url 		: null
				}
			];

			// User[0] passwords
			before(function(){
				var password = passwords[users[0].username][0];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});
			before(function(){
				var password = passwords[users[0].username][1];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});
			before(function(){
				var password = passwords[users[0].username][2];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});

			// User[1] passwords
			before(function(){
				var password = passwords[users[1].username][0];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});
			before(function(){
				var password = passwords[users[1].username][1];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});
			before(function(){
				var password = passwords[users[1].username][2];
				return knex
				.insert(password)
				.into('passwords')
				.then(function(ids){
					password.id = ids[0];
				});
			});

			// Create shares from User[0] -> User[1]
			var sharedPasswords = [undefined, undefined];
			before(function(){
				return knex
				.insert({
					owner: users[1].id,
					origin_owner: users[0].id,
					parent: null,
					origin_password: passwords[users[0].username][0].id,
					password: 'c29tZW90aGVycGFzc3dvcmQ='
				})
				.into('shared_passwords')
				.then( function(ids){
					sharedPasswords[0] = ids[0];
				} );
			});
			before(function(){
				return knex
				.insert({
					owner: users[1].id,
					origin_owner: users[0].id,
					parent: null,
					origin_password: passwords[users[0].username][2].id,
					password: 'c29tZW90aGVycGFzc3dvcmQ='
				})
				.into('shared_passwords')
				.then( function(ids){
					sharedPasswords[1] = ids[0];
				} );
			});


			var tokens = [undefined, undefined];
			before(function(done){
				// Obtain auth token -- admin
				server
				.post('/api/auth/login')
				.field('username', users[0].username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					tokens[0] = res.body.token;
					return done();
				});
			});
			before(function(done){
				// Obtain auth token -- admin
				server
				.post('/api/auth/login')
				.field('username', users[1].username)
				.field('password', 'password')
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					tokens[1] = res.body.token;
					return done();
				});
			});

		}

		describe('Fails due to parameter invalidity', function(){

			it('throws an error when the id is the wrong type', function(done){
				// Delete
				server
				.del('/api/users/'+ users[1].id+'/passwords/shares/'+true)
				.set('Authorization', 'Bearer ' + tokens[0])
				.expect(function(res){
					assert.equal(res.body.message, 'Validation error');
					assert.equal(res.body.errors.length, 1)

					assert.equal(res.body.errors[0].field, 'id')
					assert.equal(res.body.errors[0].error, 'is the wrong type')
				})
				.expect(400, done);
			});

			it('throws an error when the id is the wrong format', function(done){
				// Delete
				server
				.del('/api/users/'+ users[1].id+'/passwords/shares/test')
				.set('Authorization', 'Bearer ' + tokens[0])
				.expect(function(res){
					assert.equal(res.body.message, 'Validation error');
					assert.equal(res.body.errors.length, 1)

					assert.equal(res.body.errors[0].field, 'id')
					assert.equal(res.body.errors[0].error, 'is the wrong type')
				})
				.expect(400, done);

			});

		});

		it('fails when trying to delete non-existant shared password', function(done){
			// Delete
			server
			.del('/api/users/'+ users[1].id+'/passwords/shares/1337')
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(function(res){
				assert.equal(res.body.message, 'Password was not found');
			})
			.expect(404, done);
		});

		it('fails when trying to delete another users shared password', function(done){
			// Delete
			server
			.del('/api/users/'+ users[1].id+'/passwords/shares/'+sharedPasswords[1])
			.set('Authorization', 'Bearer ' + tokens[0])
			.expect(function(res){
				assert.equal(res.body.message, 'Insufficient privileges');
			})
			.expect(403, done);
		});

		describe('succeeds in deleting a password', function(){
			
			it('succeeds in deleting a password', function(done){
				// Delete
				server
				.del('/api/users/'+ users[1].id+'/passwords/shares/'+sharedPasswords[1])
				.set('Authorization', 'Bearer ' + tokens[1])
				.expect(function(res){
					assert.equal(res.body, 'OK');
				})
				.expect(200, done)
			});

			it('verify in database', function(){
				return knex('shared_passwords')
				.select()
				.where({owner: users[1].id, id: sharedPasswords[1]})
				.then(function(rows){
					assert.equal(rows.length, 0);
				});
			});

		});



	});

	describe('#update', function(){

	});







});