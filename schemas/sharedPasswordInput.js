module.exports = {
	"description" : "Shared Password Entry",
	"required": true,
	"type": "object",
	"properties": {
		"owner":{
			"description": "User ID of the user owning the shared password (not original owner)",
			"required":true,
			"type": ["number", "string"],
			"pattern":/[0-9]+/,
			"example":1
		},
		"origin_owner":{
			"description": "User ID of the user owning the original Password Entry",
			"required":true,
			"type": ["number", "string"],
			"pattern":/[0-9]+/,
			"example":1
		},
		"password":{
			"description": "Password for the Password Entry, in encrypted BLOB format, base64 encoded",
			"required":true,
			"type": "string",
			"pattern":/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/
		},
		"origin_password":{
			"description": "Password ID of the origin, of the shared password",
			"required":true,
			"type": ["number", "string"],
			"pattern":/[0-9]+/,
			"example":1
		}
	}
};


