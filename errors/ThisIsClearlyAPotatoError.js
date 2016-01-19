const Promise 	= require('bluebird');
const util 		= require('util');

function ThisIsClearlyAPotatoError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'ThisIsClearlyAPotatoError';
}
util.inherits(ThisIsClearlyAPotatoError, Promise.OperationalError);

module.exports = ThisIsClearlyAPotatoError;