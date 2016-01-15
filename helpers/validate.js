const validator = require('validator');

exports.username = function(username) {
	return ( username !== undefined && username !== '' && validator.isAlphanumeric(username) );
}

exports.password = function(password){
	return ( password !== undefined && password !== '' );
}

exports.privateKey = function(privateKey){
	return ( privateKey !== undefined && privateKey !== '' && this.base64(privateKey) );
}

exports.publicKey = function(publicKey){
	return (publicKey !== undefined && publicKey !== '' && this.base64(publicKey) ); 
}

exports.base64 = function(base64){
	return !base64.match(/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/);
}
