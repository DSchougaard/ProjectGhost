module.exports = {
	"description" : "Schema for posting new user User",
	"required": true,
	"type": "object",
	"properties": {
		"username":{
			"description" : "Username of the User",
			"required": true,
			"type": "string",
			"example": "User1"
		},
		"password":{
			"description" : "Password",
			"required": true,
			"type": "string",
			"example": "********"
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
		}
	}
};


		///^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
