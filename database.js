const config = require(__base + 'config.json');

var opts = {
	database : typeof config.database !== undefined ? config.database : 'sqlite'
}

if( config.database === 'sqlite' ){
	opts.database = 'sqlite3';
	opts.connection = config.sqlite_connection;
}else if( config.database === 'mysql' ){
	opts.connection = config.mysql_connection;
}else if( config.database === 'postgres' ){
	opts.connection = config.postgres_connection;
}

// Unittest DB Override
if( process.env.NODE_ENV === 'test' ){
	opts.connection.filename = './unittest.sqlite';
}


var knex = undefined;

if( config.database === 'sqlite' || config.database === 'sqlite3' ){
	knex = require('knex')({
		client: 'sqlite3',
		connection: opts.connection,
		pool:{
			afterCreate: (conn, cb) =>
				conn.run('PRAGMA foreign_keys = ON', cb)
			}
		});
}else{
	knex = require('knex')({
		client: opts.database,
		connection : opts.connection
	});
}

module.exports = knex;