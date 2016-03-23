module.exports = {
	"description" : "Schema for updating User",
	"required": true,
	"type": "object",
	"properties": {
		"username":{
			"description" : "Username of the User",
			"required": false,
			"type": ["string", 'null'],
			"example": "User1"
		},
		"isAdmin":{
			"description": "Denotes if the user is admin",
			"required": false,
			"type": ["boolean", 'null'],
			"example":0
		},
		"password":{
			"description" : "Password",
			"required": false,
			"type": ["string", 'null'],
			"example": "********"
		},
		"publickey":{
			"description": "Public key of the user",
			"required": false,
			"type": ["string", 'null'],
			"pattern": /^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"privatekey":{
			"description": "Private key of the user",
			"required":false,
			"type": ["string", 'null'],
			"pattern": /^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"iv":{
			"description": "IV for the encryption blob",
			"required": false,
			"type": ["string", 'null'],
			"pattern":/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"pk_salt":{
			"description": "Salt for deriving the users encryption key, for encrypting and decrypting the privatekey.",
			"required": false,
			"type": ["string", 'null'],
			"pattern":/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		'two_factor_secret':{
			'description': 'Secret used for two-factor authentication',
			'required': false,
			'type': ['string', 'null']
		},
		'two_factor_enabled':{
			'description': 'Determines if two-factor authentication is enabled',
			'required': false,
			'type': ['boolean', 'integer', 'null']
		}
	}
};


		///^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
