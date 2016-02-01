const restify 	= require('restify');
const util 		= require('util');

function ValidationRestError(message, errors) {
	restify.RestError.call(this, {
		restCode: 'ValidationError',
		statusCode: 400,
		message: message,
		constructorOpt: ValidationRestError
	});
	this.name = 'ValidationError';

	this.body.errors = [];

	for( var i = 0 ; i < errors.length ; i++ ){
		var t = (errors[i].property).split('.');
		var field = t.length === 2 ? t[1] : t[0];
		this.body.errors.push({ field: field, error: errors[i].message } );
	}

};

util.inherits(ValidationRestError, restify.RestError);
module.exports = ValidationRestError;