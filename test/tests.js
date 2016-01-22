global.__base 		= __dirname + '/../';

before(function(){
	var knex = require(__base + 'database.js');		
})

before(function(done){
	setTimeout(done, 1000);
})

require('./base64.js');
require('./edge.js');
