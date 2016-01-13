module.exports.encode = function(string) {
	return (new Buffer(string).toString('base64'));
}

module.exports.decode = function(base64){
	return (new Buffer(base64, 'base64').toString('utf8'));
}