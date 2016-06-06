process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var _					= require('underscore');

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);
var knex 				= require(__base + 'database.js');

describe('Passwords', function(){

	function generateTemplateUser(username){
		return {
			username 	: 'Auditing#Passwords#' + username,
			isAdmin 	: false,
			salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
			password 	: '$argon2i$v=19$m=4096,t=3,p=1$QxwYZOjg6xedW7ilBkTskA$CP4vv+Du+0r3oYh+aFxH4CQFRv/tY39kgs2KG8+8f/A',
			privatekey 	: 'cGFzc3dvcmQ=',
			iv 			: 'cGFzc3dvcmQ=',
			pk_salt 	: 'cGFzc3dvcmQ=',
			publickey 	: 'cGFzc3dvcmQ='
		};
	}

	function generateTemplatePassword(title){
		return { 
			owner 		: null,
			parent 		: null,
			title 		: 'Auditing#Passwords#'+title,
			username 	: 'Auditing#Passwords#'+title+'-User',
			password 	: 'cGFzc3dvcmQ=',
			note 		: 'This is clearly a note!',
			url 		: null
		};
	}

	var userIds = [];

	describe('makes an audit entry when the password collection is retrieved', function(){
		
		var user = generateTemplateUser('User01');
		var passwords = [];
		var token =  undefined;

		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);

					passwords.push( generateTemplatePassword('User01-Password01') );
					passwords.push( generateTemplatePassword('User01-Password02') );
					passwords.push( generateTemplatePassword('User01-Password03') );
					for( var i = 0 ; i < passwords.length ; i++ ){
						passwords[i].owner = ids[0];
					}

					return knex('passwords')
					.insert(passwords);
				})
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
			.get('/api/users/'+user.id+'/passwords')
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
				assert.equal(rows[0].targetType, 	'password collection' );
				assert.equal(rows[0].targetId, 		undefined);
				assert.equal(rows[0].action, 		1);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('makes an audit entry when a single password is retrieved', function(){
		var user = generateTemplateUser('User02');
		var password = generateTemplatePassword('User02-Password01');
		var token =  undefined;
		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);

					password.owner = user.id;
					return knex('passwords')
					.insert(password);
				})
				.then(function(ids){
					password.id = ids;
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
			.get('/api/users/'+user.id+'/passwords/'+password.id)
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
				assert.equal(rows[0].targetType, 	'password' );
				assert.equal(rows[0].targetId, 		password.id);
				assert.equal(rows[0].action, 		1);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('makes an audit entry when a password is created', function(){
		var user = generateTemplateUser('User03');
		var password = generateTemplatePassword('User03-Password01');
		var token =  undefined;
		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);

					password.owner = user.id;
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
			.post('/api/users/'+user.id+'/passwords')
			.set('Authorization', 'Bearer ' + token)
			.send(password)
			.expect(201)
			.end(function(err, res){
				if(err) return done(err);

				password.id = res.body.id;
				return done();
			});

		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', user.id)
			.then(function(rows){
				assert.equal(rows.length,  1);

				assert.equal(rows[0].userId,  		user.id);
				assert.equal(rows[0].targetType, 	'password' );
				assert.equal(rows[0].targetId, 		password.id);
				assert.equal(rows[0].action, 		0);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});	
	});

	describe('makes an audit entry when a password is updated', function(){
		var user 		= generateTemplateUser('User04');
		var password 	= generateTemplatePassword('User04-Password01');
		var token 		=  undefined;
		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);

					password.owner = user.id;
					return knex('passwords')
					.insert(password);
				})
				.then(function(ids){
					password.id = ids;
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
			.put('/api/users/'+user.id+'/passwords/'+password.id)
			.send({url: 'www.figmentofmyimagination.com'})
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
				assert.equal(rows[0].targetType, 	'password' );
				assert.equal(rows[0].targetId, 		password.id);
				assert.equal(rows[0].action, 		2);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});

	describe('makes an audit entry when a password is deleted', function(){
		var user 		= generateTemplateUser('User05');
		var password 	= generateTemplatePassword('User05-Password01');
		var token 		=  undefined;
		{
			before(function(){
				return knex('users')
				.insert(user)
				.then(function(ids){
					user.id = ids[0];
					userIds.push(user.id);

					password.owner = user.id;
					return knex('passwords')
					.insert(password);
				})
				.then(function(ids){
					password.id = ids;
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
			.delete('/api/users/'+user.id+'/passwords/'+password.id)
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
				assert.equal(rows[0].targetType, 	'password' );
				assert.equal(rows[0].targetId, 		password.id);
				assert.equal(rows[0].action, 		3);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			});
		});
	});


	/*
		Shared Passwords
	*/

	describe('makes an audit entry when a password is shared', function(){
		var users 		= [ generateTemplateUser('User06') , generateTemplateUser('User07') ]; 
		var password 	= generateTemplatePassword('User06-Password01');
		var token 		=  undefined;
		var shareId 	= undefined;
		{
			before(function(){
				return knex('users')
				.insert(users[0])
				.then(function(ids){
					users[0].id = ids[0];
					userIds.push(users[0].id);

					password.owner = users[0].id;
					return knex('passwords')
					.insert(password);
				})
				.then(function(ids){
					password.id = ids;
				});
			});

			before(function(){
				return knex('users')
				.insert(users[1])
				.then(function(ids){
					users[1].id = ids[0];
					userIds.push(users[1].id);
				});
			});

			before(function(done){
				server
				.post('/api/auth/login')
				.field('username', users[0].username)
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
			.post('/api/users/'+users[0].id+'/passwords/'+password.id+'/shares')
			.send({
				owner: users[1].id,
				password: 'QWxsIHdvcmsgYW5kIG5vIHBsYXkgbWFrZXMgRGFuaWVsIGEgZHVsbCBib3k='
			})
			.set('Authorization', 'Bearer ' + token)
			.end(function(err, res){
				if(err) return done(err);
				shareId = res.body.id;
				return done();
			});		
		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', users[0].id)
			.then(function(rows){
				assert.equal(rows.length,   		1);

				assert.equal(rows[0].userId,  		users[0].id);
				assert.equal(rows[0].targetType, 	'password' );
				assert.equal(rows[0].targetId, 		password.id);
				assert.equal(rows[0].action, 		4);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

				/*return knex('audit')
				.select()
				.where('userId', users[1].id);*/
			})
			/*.then(function(rows){
				console.dir(rows);
				assert.equal(rows.length,   		1);

				assert.equal(rows[0].userId,  		users[1].id);
				assert.equal(rows[0].targetType, 	'shared password' );
				assert.equal(rows[0].targetId, 		shareId);
				assert.equal(rows[0].action, 		0);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);

			})*/
		});
	});

	describe('makes an audit entry when a shared password is deleted', function(){
		var users 			= [ generateTemplateUser('User08') , generateTemplateUser('User09') ]; 
		var password 		= generateTemplatePassword('User08-Password01');
		var token 			= undefined;
		var sharedPassword 	= {
								parent 		: null,
								password 	: 'SG93IG1hbnkgbW9yZSBvZiB0aGVzZSBiZWZvcmUgSSBhbSBkb25lPyE=',
							};
		{
			before(function(){
				return knex('users')
				.insert(users[0])
				.then(function(ids){
					users[0].id = ids[0];
					userIds.push(users[0].id);

					sharedPassword.origin_owner = users[0].id;

					password.owner = users[0].id;
					return knex('passwords')
					.insert(password);
				})
				.then(function(ids){
					password.id = ids[0];
					sharedPassword.origin_password = password.id;

				});
			});

			before(function(){
				return knex('users')
				.insert(users[1])
				.then(function(ids){
					users[1].id = ids[0];
					userIds.push(users[1].id);

					sharedPassword.owner = users[1].id;

				});
			});

			before(function(){
				return knex('shared_passwords')
				.insert(sharedPassword)
				.then(function(rows){
					sharedPassword.id = rows[0];
				});
			})

			before(function(done){
				server
				.post('/api/auth/login')
				.field('username', users[1].username)
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
			.delete('/api/users/'+users[1].id+'/passwords/shares/'+sharedPassword.id)
			.set('Authorization', 'Bearer ' + token)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				return done();
			});

		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', users[1].id)
			.then(function(rows){
				assert.equal(rows.length,   		1);

				assert.equal(rows[0].userId,  		users[1].id);
				assert.equal(rows[0].targetType, 	'shared password' );
				assert.equal(rows[0].targetId, 		sharedPassword.id);
				assert.equal(rows[0].action, 		3);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});
		});
	});

	describe('makes an audit entry when a shared password updated', function(){
		var users 			= [ generateTemplateUser('User10') , generateTemplateUser('User11') ]; 
		var password 		= generateTemplatePassword('User11-Password01');
		var token 			= undefined;
		var sharedPassword 	= {
								parent 		: null,
								password 	: 'SG93IG1hbnkgbW9yZSBvZiB0aGVzZSBiZWZvcmUgSSBhbSBkb25lPyE=',
							};
		{
			before(function(){
				return knex('users')
				.insert(users[0])
				.then(function(ids){
					users[0].id = ids[0];
					userIds.push(users[0].id);

					sharedPassword.origin_owner = users[0].id;

					password.owner = users[0].id;
					return knex('passwords')
					.insert(password);
				})
				.then(function(ids){
					password.id = ids[0];
					sharedPassword.origin_password = password.id;

				});
			});

			before(function(){
				return knex('users')
				.insert(users[1])
				.then(function(ids){
					users[1].id = ids[0];
					userIds.push(users[1].id);

					sharedPassword.owner = users[1].id;

				});
			});

			before(function(){
				return knex('shared_passwords')
				.insert(sharedPassword)
				.then(function(rows){
					sharedPassword.id = rows[0];
				});
			})

			before(function(done){
				server
				.post('/api/auth/login')
				.field('username', users[1].username)
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
			.put('/api/users/'+users[1].id+'/passwords/shares/'+sharedPassword.id)
			.send({
				password: 'QWxsIHdvcmsgYW5kIG5vIHBsYXkgbWFrZXMgRGFuaWVsIGEgZHVsbCBib3k='
			})
			.set('Authorization', 'Bearer ' + token)
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);

				return done();
			});

		});

		it('verifies in the database', function(){
			return knex('audit')
			.select()
			.where('userId', users[1].id)
			.then(function(rows){
				assert.equal(rows.length,   		1);

				assert.equal(rows[0].userId,  		users[1].id);
				assert.equal(rows[0].targetType, 	'shared password' );
				assert.equal(rows[0].targetId, 		sharedPassword.id);
				assert.equal(rows[0].action, 		2);
				assert.equal(rows[0].host, 			'127.0.0.1');
				assert.notEqual(rows[0].time, 		undefined);
			});
		});	
	});

	describe('makes an audit entry when a shared password is revoked', function(){
		it.skip('successfully completes api request', function(done){});

		it.skip('verifies in the database', function(){});
	});

	{

		after(function(){
			return knex('audit')
			.del()
			.then();
		})

		after(function(){
			return knex('shared_passwords')
			.del()
			.whereIn('owner', userIds)
			.then();
		});

		after(function(){
			return knex('passwords')
			.del()
			.whereIn('owner', userIds)
			.then();
		});

		after(function(){
			return knex('users')
			.del()
			.whereIn('id', userIds)
			.then();
		});

	}

});