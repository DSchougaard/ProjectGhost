module.exports = {
	"description" : "Password Entry",
	"required": true,
	"type": "object",
	"properties": {
		"id":{
			"description": "ID of the Password Entry",
			"required": true,
			"type": "number",
			"example": 1337
		},
		"owner":{
			"description": "User ID of the user owning the Password Entry",
			"required":true,
			"type":"number",
			"example":1
		},
		"parent":{
			"description" : "ID of the parent category",
			"required": true,
			"type": ["number", 'null'],
			"example": 1
		},
		"title":{
			"description": "Title for the Password Entry",
			"required":true,
			"type":"string"
		},
		"username":{
			"description": "Username for the Password Entry",
			"required":true,
			"type":"string"
		},
		"password":{
			"description": "Password for the Password Entry, in encrypted BLOB format, base64 encoded",
			"required":true,
			"type": "string",
			"pattern":/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"iv":{
			"description": "IV for the encryption blob",
			"required": true,
			"type": "string",
			"pattern":/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"note":{
			"description": "Note for the Password Entry",
			"required":false,
			"type": ["string", 'null']
		}
	}
};


