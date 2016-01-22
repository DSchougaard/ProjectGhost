var knex;

module.exports.connect = function(opts){
	knex = require('knex')({
		client: opts.database,
		connection: opts.connection
	});
	return knex;
}

module.exports.get = function(){
	return knex;
}