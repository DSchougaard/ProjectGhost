
/*module.exports.connect = function(opts){
	knex = require('knex')({
		client: opts.database,
		connection: opts.connection
	});
	return knex;
}

module.exports.get = function(){
	return knex;
}*/


module.exports = function(opts){
	var knex = undefined;

	if( opts === undefined ){
		return knex;
	}

	knex = require('knex')({
		client: opts.database,
		connection: opts.connection
	});
	return knex;

}