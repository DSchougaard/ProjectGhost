const restify 			= require('restify');
const knex 				= require('knex');

const authHelpers 		= require(__base + 'helpers/authHelpers.js');

module.exports = function(server, knex){

	server.get('/api/password/:id', authHelpers.ensureAuthenticated, function(req, res, next){
		return next(new restify.errors.NotImplementedYet('API endpoint not implemented yet'));
	});

	server.post('/api/password', authHelpers.ensureAuthenticated, function(req, res, next){
		return next(new restify.errors.NotImplementedYet('API endpoint not implemented yet'));
	});

	server.del('/api/password', authHelpers.ensureAuthenticated, function(req, res, next){
		return next(new restify.errors.NotImplementedYet('API endpoint not implemented yet'));
	});

	server.put('/api/password', authHelpers.ensureAuthenticated, function(req, res, next){
		return next(new restify.errors.NotImplementedYet('API endpoint not implemented yet'));
	});

}