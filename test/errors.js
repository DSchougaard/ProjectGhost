const ValidationError 		= require(__base + 'errors/ValidationError.js');
const assert = require('assert');

it('Validation error should be well-formed', function(){
	var errors = undefined;
	try{
		errors = [
			{
				property: 'data.id',
				message: 'is wrong type'
			},
			{
				property: 'data.username',
				message: 'is missing'
			}
		];
	
		throw new ValidationError(errors);
	}catch(err){
		assert.equal(err.num, 2);
		assert.equal(err.errors, errors);
		assert.equal(err.message, '2 errors: data.id is wrong type. data.username is missing.')
	}	
});