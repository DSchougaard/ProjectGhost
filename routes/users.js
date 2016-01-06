const fs = require('fs');
const restify = require('restify');
const validator = require('validator');

module.exports = function(server, knex){
	server.post('/user', function(req, res, next){
		
		console.log("POST /user %j", req.body);		

		if( !validator.isAlphanumeric(req.body.username) )
			next(new restify.)



		next(new restify.errors.NotImplementedError("Later..."));
	})

	server.put('/user', function(req, res, next){
		next(new restify.errors.NotImplementedError("Later..."));
	})

	server.del('/user', function(req, res, next){
		next(new restify.error.shtNtotImplementedError("Later..."));
	})
};