process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var assert 				= require('assert');
var request 			= require('supertest');  
var _					= require('underscore');

var restifyInstance 	= require(__base + 'app.js');
var server 				= request(restifyInstance.server);
var knex 				= require(__base + 'database.js');

describe("Auditing on Routes", function(){
	describe('Authentication', function(){

	});

	describe('Users', function(){

	});

	describe('Passwords', function(){

	});

	describe('Shared Passwords', function(){

	});

	describe('Categories', function(){

	});

	describe('Invites', function(){

	});
	
});