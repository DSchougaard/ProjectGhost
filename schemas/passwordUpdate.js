module.exports = {
	"description" : "Password Entry",
	"required": true,
	"type": "object",
	"properties": {
		"owner":{
			"description": "User ID of the user owning the Password Entry",
			"required":false,
			"type":["number", 'null'],
			"example":1
		},
		"parent":{
			"description" : "ID of the parent category",
			"required": false,
			"type": ["number", 'null'],
			"example": 1
		},
		"title":{
			"description": "Title for the Password Entry",
			"required":false,
			"type":["string", 'null']
		},
		"username":{
			"description": "Username for the Password Entry",
			"required":false,
			"type":["string", 'null']
		},
		"password":{
			"description": "Password for the Password Entry, in encrypted BLOB format, base64 encoded",
			"required":false,
			"type": ["string", 'null'],
			"pattern":/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"url":{
			"decription": "URL for the password entry",
			"required": false,
			"type": ['string', 'null'],
			"example": "www.google.com"
		},
		"note":{
			"description": "Note for the Password Entry",
			"required":false,
			"type": ["string", 'null']
		}
	}
};


