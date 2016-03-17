'use strict'
const Promise 					= require('bluebird');
const uuid 						= require('uuid');
const moment 					= require('moment');
const schemagic 				= require('schemagic');

// Database Inject
var knex 						= require(__base + 'database.js');

// Models
const User 						= require(__base + 'models/user.js');

// Errors
const UserDoesNotExistError 	= require(__base + 'errors/UserDoesNotExistError.js');
const ValidationError 			= require(__base + 'errors/ValidationError.js');
const SqlError 					= require(__base + 'errors/SqlError.js');
const InviteDoesNotExistError 	= require(__base + 'errors/InviteDoesNotExistError.js');
const OperationalError 			= Promise.OperationalError;

// Error handler for SQL
function SQLErrorHandler(err){
	if( err.errno === 19 && err.code === 'SQLITE_CONSTRAINT' ){
		return new Promise.reject( new SqlError('Username already exists') );
		//throw new SqlError('Username already exists.')
	}else if( err.errno === 5 && err.code === 'SQLITE_BUSY'){
		return new Promise.reject( new SqlError('database temporarily unavailable') );
	}

	return new Promise.reject( err );
}

module.exports = class Invite{
	
	constructor(data){
		var self 		= this;
		self.id  		= data.id;
		self.expires 	= moment(data.expires);
		self.link 		= data.link;
		self.used 		= data.used 	|| false;
	}

	static createTable(){
		return knex.schema.createTableIfNotExists('invites', function(table){
    		table.uuid('id').notNullable().primary();
			table.dateTime('expires').notNullable();
			table.boolean('used').defaultTo(false);
		});
	}

	static create(){

		var data = {
			link: uuid.v4(),
			expires: moment().add(24, 'hours').unix(),
			used: false
		}

		var link = uuid.v4();
		return knex('invites')
		.insert(data)
		.then(function(id){
			if( id.length === 0 ){
				return Promise.reject( new InviteDoesNotExistError() );
			}
			
			// Append ID and create the new object
			data.id = id[0];
			return Promise.resolve( new Invite(data) );

		}, SQLErrorHandler);
	}

	static find(link){

		var validUUID = schemagic.uuid.validate(link);
		if( !validUUID.valid ){
			// Dirty dirty hack, to make schemagic accept strings being in int form.
			return new Promise.reject( new ValidationError(validUUID.errors) );
		}

		return knex('invites')
		.select()
		.where('link', link)
		.then(function(rows){
			if( rows.length === 0 ){
				return Promise.reject( new InviteDoesNotExistError(link) );
			}

			return Promise.resolve( new Invite(rows[0]) );

		});
	}

	use(user){
		var self = this;

		return knex.transaction(function(trx){
			
			return trx
			.select()
			.from('invites')
			.where('id', self.id)
			.then(function(rows){

				if( rows.length !== 1 || rows[0].used === true ){
					console.log("Rolling back...");
					trx.rollback;
					return Promise.reject( new Error('Invite already used') );
				}

				return User.create(user, trx);

			})
			.then(function(user){

				return Promise.all([
					Promise.resolve(user),
					trx
					.into('invites')
					.where('id', self.id)
					.update('used', true)
				]);
			})
			.then(function(user, rows){
				trx.commit;
				return Promise.resolve(rows[0]);
			})
			.catch(trx.rollback);
		});
	}


}