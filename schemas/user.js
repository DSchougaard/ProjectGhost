module.exports = {
	"description" : "User",
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
			"type":"number",
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
			"type": "string"
		}
	}
};


		///^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
