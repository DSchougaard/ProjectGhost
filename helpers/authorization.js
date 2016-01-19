var Promise 	= require("bluebird");
const util 		= require('util');
var q = require('q')

// Erros - BlueBird
const OperationalError 			= Promise.OperationalError;

// Errors - Ghost
const UnauthorizedError 		= require(__base + 'errors/UnauthorizedError.js');
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const PasswordDoesNotExistError 	= require(__base + 'errors/PasswordDoesNotExistError.js');



module.exports.types = {
	user 	: 0,
	password: 1
}


module.exports.isAuthorized = function(knex, type, userID, accessID){
	switch(type){
		case this.types.user:
			return isAuthorizedUser(knex, userID, accessID);
			break;
		case this.types.password:
			return isAuthorizedPassword(knex, userID, accessID);
			break;
	}
}


function isAuthorizedUser (knex, userID, accessID){
	if( userID === accessID ){
	   //return q.promise.resolve({result:true});
	   return new Promise.resolve({result:true});
	}

	return knex
    .select('id','isAdmin')
    .from('users')
    .where('id', userID)
    .orWhere('id', accessID)
    .then(function(rows){

    	if( rows.length === 0 || ( rows.length === 1 && rows[0].id == accessID ) ){
    		//return new Promise.reject(new UnauthorizedError('Invalid user ID'));
    		throw new UnauthorizedError('Invalid user ID');

    	}

        if( rows.length === 1 && rows[0].id == userID ){
            //throw new Error('Invalid target ID');
            throw new UnauthorizedError('Invalid target ID');
        }

        return new Promise.resolve({result: Boolean( (rows[0].id === userID &&  rows[0].isAdmin) || (rows[1].id === userID && rows[1].isAdmin) )});
    });

}

function getUser(knex, id){
	return knex('users')
	.select()
	.where('id', id)
	.then(function(rows){
		if( rows.length === 0 ){
			throw new UserDoesNotExistError(id);
		}
		if( rows.length > 1 ){
			throw new OperationalError('Catatrophic database error. Multiple users with same ID found.');
		}
		return new Promise.resolve(rows[0]);
	});
}

function getPassword(knex, id){
	return knex('passwords')
	.select()
	.where('id', id)
	.then(function(rows){
		if( rows.length === 0 ){
			throw new PasswordDoesNotExistError(id);
		}
		if( rows.length > 1 ){
			throw new OperationalError('Catatrophic database error. Multiple users with same ID found.');
		}

		return new Promise.resolve(rows[0]);
	});
}

function isAuthorizedPassword(knex, userID, passwordID){
	return Promise.all([
		getUser(knex, userID), 
		getPassword(knex, passwordID)
	])
	.spread(function(user, password){
		if( user.id === password.owner )
			return new Promise.resolve(true);

		throw new UnauthorizedError('Insufficient privileges'); 
	});
}