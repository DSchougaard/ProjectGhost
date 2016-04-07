'use strict'
// Libraries
const Promise 		= require('bluebird');
const _ 			= require('underscore');
const schemagic 	= require('schemagic');

// Models
const User 			= require(__base + 'models/user.js');
const Category 		= require(__base + 'models/category.js');
const Invite 		= require(__base + 'models/invite.js');
//const Password 		= require(__base )


// Database injection
var knex 			= require(__base + 'database.js');


/*
	Target Table
	ID  		Name
	1			Password
	2 			User
	3			Category
	4 			Invite
	5 			Shared Password
	6 			KeyPair
*/

/*
	Action Table
	ID 			Action
	1 			Create
	2 			Read
	3			Update
	4 			Delete
	5 			Share

*/

/*
	Primary Table 
	ID
	Time
	Target
	TargetID
	TargetAction
	UserID
	HostIP

*/


module.exports = class Audit{

}