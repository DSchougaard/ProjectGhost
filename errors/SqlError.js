const Promise 	= require('bluebird');
const util 		= require('util');

function SqlError(message){
	Promise.OperationalError.call(this, message);
	this.name = "SqlError";
}
util.inherits(SqlError, Promise.OperationalError);
module.exports = SqlError;