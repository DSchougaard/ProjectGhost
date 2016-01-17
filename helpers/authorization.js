const q 	= require('q');
var Promise = require("bluebird");


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


function isAuthorizedUser(knex, userID, accessID){
	if( userID === accessID ){
	   return q.promise.resolve({result:true});
	}

	return knex
    .select('id','isAdmin')
    .from('users')
    .where('id', userID)
    .orWhere('id', accessID)
    .then(function(rows){
        if( rows.length < 2 ){
            return { result: false, error: 'Invalid ID'};
        }

        return {result: Boolean( (rows[0].id === userID &&  rows[0].isAdmin) || (rows[1].id === userID && rows[1].isAdmin) )}
    })
    .catch(function(err){
        console.log("An error happened", err);
        return { result: false, error: err};
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