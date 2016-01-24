global.__base 		= __dirname + '/../';


before(function(){
	var knex = require(__base + 'database.js');		
})

before(function(done){
	setTimeout(done, 1000);
})

require(__base + 'test/base64.js');

describe('Models', function(){
	require(__base + 'test/models/user.js');
	require(__base + 'test/models/password.js');
})