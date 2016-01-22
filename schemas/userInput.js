module.exports = {
	"description" : "User",
	"required": true,
	"type": "object",
	"properties": {
		"username":{
			"description" : "Username of the User",
			"required": true,
			"type": "string",
			"example": "User1"
		},
		"isAdmin":{
			"description": "Denotes if the user is admin",
			"required": true,
			"type":"boolean",
			"example":0
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
		}
	}
};


		///^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
