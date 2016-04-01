module.exports = {
	"description" : "Shared Password Entry",
	"required": true,
	"type": "object",
	"properties": {
		"password":{
			"description": "Password for the Password Entry, in encrypted BLOB format, base64 encoded",
			"required":false,
			"type": ['string', 'null'],
			"pattern":/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"parent":{
			"description" : "ID of the parent category",
			"required": false,
			"type": ["number", 'null'],
			"example": 1
		}
	}
};


