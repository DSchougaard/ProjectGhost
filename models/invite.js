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
const InvalidInviteError 		= require(__base + 'errors/InvalidInviteError.js');
const OperationalError 			= Promise.OperationalError;
const AlreadyExistError 		= require(__base + 'errors/Internal/AlreadyExistError.js');


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
		self.expires 	= moment.unix(data.expires);
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

		//console.log("Invite#find " + link);

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

	status(){
		var self = this;
		
		var payload = {
			used: false,
			expired: false
		}

		payload.used = ( self.used === true || self.used === 1 ) ? true : false;
		payload.expired = moment().isAfter( moment.unix(self.expires) );

		return payload;
	}

	del(){
		var self = this;

		return knex('invites')
		.where('link', self.link)
		.del()
		.then(function(rows){
			if( rows.length < 1 ){
				// No invite was found
				return Promise.reject( new InviteDoesNotExistError('Invite does not exist') );
			}

			return;
		})
		.catch(function(err){
			console.error(err);
		});
	}

	use(user){
		var self = this;

		return knex.transaction(function(trx){
			return trx
			.select()
			.from('invites')
			.where('link', self.link)
			.then(function(rows){

				if( rows.length < 1 ){
					// No invite was found
					return Promise.reject( new InviteDoesNotExistError('Invite does not exist') );
				}

				// if now is after expires
				if( moment().isBefore( moment.unix(rows[0].expires) ) ){
					return User.create(user, trx);
				}else{
					return Promise.reject( new InvalidInviteError('Invite is expired') );
				}

			})
			.then(function(user){
				return Promise.all([
					Promise.resolve(user),
					trx
					.from('invites')
					.where('link', self.link)
					.del()
				]);		
			})
			.then(function(resolved){
				return Promise.resolve(resolved[0]);
			});

		})
	}

	use_(user){
		var self = this;

		return knex.transaction(function(trx){
			return trx
			.select()
			.from('invites')
			.where('link', self.link)
			.then(function(rows){

				if( rows.length < 1 ){
					// No invite was found
					trx.rollback;
					return Promise.reject( new InviteDoesNotExistError(self.link) );
				}

				// Sigh... SQLite...
				if( rows[0].used === true || rows[0].used === 1 ){
					trx.rollback;
					return Promise.reject( new InvalidInviteError('Invite already used') );
				}

				// if now is after expires
				if( moment().isAfter( moment.unix(rows[0].expires) ) ){
					trx.rollback;
					return Promise.reject( new InvalidInviteError('Invite is expired') );
				}

				return User.create(user, trx);

			}, SQLErrorHandler)
			.then(function(user){
				return Promise.all([
					Promise.resolve(user),
					trx
					.into('invites')
					.where('link', self.link)
					.update('used', true)
				]);
			})
			.then(function(resolved){
				trx.commit;
				return Promise.resolve(resolved[0]);
			})
			//.catch(function(err){
			//	trx.rollback;
			//	//return Promise.reject(err);
			//	throw err;
			//});			
			.catch(trx.rollback);
		
		});
	}
}