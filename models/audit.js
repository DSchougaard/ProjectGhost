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

		var actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE', ''];

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

	static report(user, host, targetType, targetId, action){

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


		knex('audit')
		.insert(payload)
		.then()
		.catch(function(e){
			return new Promise.reject( new AuditError(payload, e) );
		});	
	}

	static get(user){
		return knex('audit')
		.select()
		.where('userId', user.id)
		.then(function(rows){

			for( var i = 0 ; i < rows.length ; i++){
				var action = new Action( rows[i].action );
				rows[i].action = action.text();
			}

			return new Promise.resolve(rows);

		});
	}

}