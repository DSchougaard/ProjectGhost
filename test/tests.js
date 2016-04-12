global.__base 		= __dirname + '/../';


before(function(){
	var knex = require(__base + 'database.js');		
})

before(function(done){
	setTimeout(done, 1000);
})

require(__base + 'test/base64.js');

describe('Errors', function(){
	require(__base + 'test/errors.js');
});

describe('Models', function(){
	require(__base + 'test/models/user.js');
	require(__base + 'test/models/password.js');
	require(__base + 'test/models/category.js');
	require(__base + 'test/models/invite.js');
	require(__base + 'test/models/sharedPassword.js');
	require(__base + 'test/models/audit.js');
});

describe('Middlewares', function(){
	require(__base + 'test/middlewares/authentication.js');
	require(__base + 'test/middlewares/authorization.js');
	require(__base + 'test/middlewares/resolve.js');
});

describe('Routes', function(){
	require(__base + 'test/routes/auth.js');
	require(__base + 'test/routes/users.js');
	require(__base + 'test/routes/audit.js');
	require(__base + 'test/routes/categories.js');
	require(__base + 'test/routes/invites.js');
	require(__base + 'test/routes/password.js');
	require(__base + 'test/routes/sharedPassword.js')
});

require(__base + 'test/auditing.js');