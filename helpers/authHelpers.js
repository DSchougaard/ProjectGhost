const fs 				= require('fs');
const moment 			= require('moment');
const jwt 				= require('jsonwebtoken');

const restify 			= require('restify');

// Private and Public Key for Signing JWTs
const privateKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.key');
const publicKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.crt');

exports.createJWT = function(user) {
	var payload = {
		sub: user.id,
		iat: moment().unix(),
		exp: moment().add(14, 'days').unix()
	};
	return jwt.sign(payload, privateKey, {algorithm: 'RS256'});
}

exports.ensureAuthenticated = function(req, res, next) {
	if (!req.headers.authorization) {
		return next(new restify.errors.UnauthorizedError('No Authorization header was found.'));
	}
	// Extract token from the request headers
	var token = req.headers.authorization.split(' ')[1];

	jwt.verify(token, publicKey, function(err, decoded){
		if(err){
			// Wrong token!
			return next(new restify.errors.UnauthorizedError(err));
		}

		if( decoded.exp <= moment().unix() ){
			// The token has expired
			console.log('User %s tried to authorize using an expired token.', decoded.sub);
			return next(new restify.errors.UnauthorizedError('Token has expired'));
		}
		req.user = decoded.sub;
		return next();
	});
};