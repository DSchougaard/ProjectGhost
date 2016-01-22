const config = require(__base + 'config.json');


var opts = {
	database : typeof config.database !== undefined ? config.database : 'sqlite'
}

if( config.database === 'sqlite' ){
	opts.connection = config.sqlite_connection;
}

// Unittest DB Override
if( process.env.NODE_ENV === 'test' ){
	opts.connection.filename = './unittest.sqlite';
}

var knex = require('knex')({
	client: opts.database,
	connection : opts.connection
});


module.exports = knex;

















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
/*
var knex = undefined;
module.exports.connect = function(opts){
	knex = require('knex')(opts);
	return knex;
}

module.exports.get = function(){
	return knex;
}
*/
/*
module.exports = function(opts){

	if( opts === undefined ){
		console.log("Grabbing KNEX");
		return knex;
	}

	knex = require('knex')(opts);
	console.log("Creating new KNEX: %j", opts);
	return knex;

}
*/