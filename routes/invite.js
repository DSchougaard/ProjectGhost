const restify 			= require('restify');
const _ 				= require('underscore');


module.exports = function(server, log){
	server.post('/api/invite', function(req, res, next){
		return next( new restify.errors.NotImplementedError());
	});
}