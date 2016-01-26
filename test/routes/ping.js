process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert = require('assert');
var request = require('supertest');  
var should = require('should');


var server = request(require('../app.js').server);


describe("Ping", function(){
	//var server = require("../app").getServer;
	var wrongServer = request.agent("http://localhost:8080");

	it.skip("Timeout without https for ping", function(done){
		wrongServer
		.get("/api/ping")
		.end(function(err,res){
			assert.equal(err, "Error: socket hang up");
			done();
		});
	});

	it("Get ping response with https", function(done){
		server
		.get('/api/ping')
		.expect(200)
		.end(function(err, res){
			if(err) return done(err);
			done();
		})
	});

});
