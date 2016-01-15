const fs 				= require('fs');
const moment 			= require('moment');
const jwt 				= require('jsonwebtoken');

const restify 			= require('restify');

// Private and Public Key for Signing JWTs
const privateKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.key');
const publicKey 		= fs.readFileSync(__base + '/crypto/jwt/ghost-jwt.crt');

exports.createJWT = function(user) {
	var payload = {
		uid: user.id,
		iat: moment().unix(),
		exp: moment().add(14, 'days').unix()
	};
	return jwt.sign(payload, privateKey, {algorithm: 'RS256'});
}

exports.ensureAuthenticated = function(req, res, next) {
	if (!req.headers.authorization) {
		return next(new restify.errors.UnauthorizedError('No Authorization header was found'));
	}
	// Extract token from the request headers
	var token = req.headers.authorization.split(' ')[1];

	jwt.verify(token, publicKey, function(err, decoded){
		if(err){
			// Cue Error Handling
			if( err.name === 'JsonWebTokenError' ){
				// Invalid Signature
				return next(new restify.errors.UnauthorizedError('Invalid auth token'));
			}else if( err.name === 'TokenExpiredError' ){
				// The token was expired
				console.log('User tried to authorize using an expired token');
				return next(new restify.errors.UnauthorizedError('Token has expired'));	
			}else{
				console.log('Undefined error in verifying JWT');
				return next(new restify.UnauthorizedError('Unknown failure during JWT verification'));
			}
		}

		// Append user ID to request
		req.user = decoded.uid;
		// Pass on the request
		return next();
	});
};