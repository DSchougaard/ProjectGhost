const restify = require('restify');

module.exports = function(server, knex, log){

	server.post('/api/category', function(req, res, next){
		return next(new restify.errors.NotImplementedYet('API endpoint not implemented yet'));
	});

	server.del('/api/category', function(req, res, next){
		return next(new restify.errors.NotImplementedYet('API endpoint not implemented yet'));
	});

	server.put('/api/category', function(req, res, next){
		return next(new restify.errors.NotImplementedYet('API endpoint not implemented yet'));
	});

	server.get('/api/category', function(req, res, next){
		res.setHeader('Allowed', 'POST, DEL, PUT');
		return next(new restify.errors.MethodNotAllowedError());
	});
}