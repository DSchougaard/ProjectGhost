var Promise 	= require("bluebird");
const util 		= require('util');
var q = require('q')
// Errors
const UnauthorizedError = require(__base + 'errors/UnauthorizedError.js');


module.exports.types = {
	user 	: 0,
	password: 1
}

/*function UnauthorizedError(message){ 
	Promise.OperationalError.call(this, message);
	this.name = 'UnauthorizedError';
}
util.inherits(UnauthorizedError, Promise.OperationalError);
*/

/*UnauthorizedError.prototype.toString = function(){
	return 'UnauthorizedError: ' + this.cause;
}*/


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


function _isAuthorizedUser (knex, userID, accessID){
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

        return {result: Boolean( (rows[0].id === userID &&  rows[0].isAdmin) || (rows[1].id === userID && rows[1].isAdmin) )}
    });

}

function isAuthorizedPassword(knex, userID, passwordID){
	return knex
	.select('owner')
	.from('passwords')
	.where('id', passwordID)
	.andWhere('owner', userID)
	.then(function(rows){
		if( rows.length === 0 ){
			return { result: false, error: 'Invalid ID' }
		}

		if( rows[0].owner === userID ){
			return { result: true };
		}
	})
	.catch(function(err){
		return { result: false, error: err };
	});

}