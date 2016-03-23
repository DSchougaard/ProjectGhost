module.exports = {
	"description" : "Full schema for User, as found in DB.",
	"required": true,
	"type": "object",
	"properties": {
		"id": {
			"description" : "ID of the User",
			"required": true,
			"type":"number",
			"example":"1"
		},
		"isAdmin":{
			"description": "Denotes if the user is admin",
			"required": true,
			"type":"boolean",
			"example":0
		},
		"username":{
			"description" : "Username of the User",
			"required": true,
			"type": "string",
			"example": "User1"
		},
		"salt":{
			"description" : "Salt for the users password",
			"required": true,
			"type": "string"
		},
		"password":{
			"description" : "Hashed user password",
			"required": true,
			"type": "string"
		},
		"publickey":{
			"description": "Public key of the user",
			"required":true,
			"type": "string",
			"pattern": /^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"privatekey":{
			"description": "Private key of the user",
			"required":true,
			"type": "string",
			"pattern": /^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"iv":{
			"description": "IV for the encryption blob",
			"required": true,
			"type": "string",
			"pattern":/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"pk_salt":{
			"description": "Salt for deriving the users encryption key, for encrypting and decrypting the privatekey.",
			"required": true,
			"type": "string",
			"pattern":/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		'two_factor_secret':{
			'description': 'Secret used for two-factor authentication',
			'required': false,
			'type': ['string', 'null']
		},
		'two_factor_enabled':{
			'description': 'Determines if two-factor authentication is enabled',
			'required': true,
			'type': ['boolean', 'integer']
		}
	}
};


		///^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
