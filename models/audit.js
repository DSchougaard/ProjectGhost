'use strict'
// Libraries
const Promise 			= require('bluebird');
const _ 				= require('underscore');
const schemagic 		= require('schemagic');
const moment 			= require('moment');

// Models
const User 				= require(__base + 'models/user.js');
const Category 			= require(__base + 'models/category.js');
const Invite 			= require(__base + 'models/invite.js');
const SharedPassword	= require(__base + 'models/sharedPassword.js');
const Password 			= require(__base + 'models/password.js');
const ValidationError 	= require(__base + 'errors/ValidationError.js');

// Errors
const AuditError 	= require(__base + 'errors/Internal/AuditError.js');

// Database injection
var knex 			= require(__base + 'database.js');

class Action{
	constructor(input){

		this.actionId 	= 0;
		this.actionName = '';

		var actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE', '', 'SUCCESS', 'FAILURE'];
		/*
			Create 	: 0
			Read 	: 1
			Update 	: 2
			Delete 	: 3
			Share 	: 4
			NoOp 	: 5
			Success : 6
			Failure : 7
		*/

		if( isNaN(input) ){
			this.actionId 	= _.indexOf(actions, input.toUpperCase());
			this.actionName = input;
		}else{
			this.actionId 	= input;
			this.actionName = actions[input];
		}
	}

	text(){
		return this.actionName;
	}

	id(){
		return this.actionId;
	}
}

module.exports = class Audit{

	static report(user, request, targetType, targetId, action){
   
		var ip = request.headers['x-forwarded-for'] || 
		request.connection.remoteAddress || 
		request.socket.remoteAddress ||
		request.connection.socket.remoteAddress;

		var host = undefined;
		if(ip === '::1'){
			// This is localhost
			host = '127.0.0.1'
		}else if( ip.substr(0, 7) === '::ffff:' ){
			host = ip.substr(7);
		}else{
			host = ip;
		}

		var validate = schemagic.user.validate(user);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		var payload = {
			userId: user.id,
			host: host,
			targetType: targetType.toLowerCase(),
			targetId: targetId,
			action: (new Action(action)).id(),
			time: moment().unix(),
		}

		//console.info('Auditing: %j', payload);

		knex('audit')
		.insert(payload)
		.then(function(r){
		})
		.catch(function(e){
			console.log(e)
			return new Promise.reject( new AuditError(payload, e) );
		});	
	}

	static getHosts(user){
		var validate = schemagic.user.validate(user);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		return knex('audit')
  		.distinct('host')
		.select();
	}

	static get(user){

		var validate = schemagic.user.validate(user);
		if( !validate.valid ){
			return new Promise.reject( new ValidationError(validate.errors) );
		}

		return knex('audit')
		.select()
		.where('userId', user.id)
		.then(function(rows){

			for( var i = 0 ; i < rows.length ; i++){
				var action = new Action( rows[i].action );
				rows[i].action = action.text();

				//rows[i].time = moment.unix(rows[i].time).format('MMMM Do YYYY, H:mm:ss');
			}

			return new Promise.resolve(rows);

		})
		.catch(function(err){
			if( err.errno === 19 && err.code === 'SQLITE_CONSTRAINT' ){
				return new Promise.reject( new SqlError(err) );
				//throw new SqlError('Username already exists.')
			}else if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
				return new Promise.reject( new SqlError('database temporarily unavailable') );
			}

			return new Promise.reject( err );
		});
	}

}