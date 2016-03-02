module.exports = {
	"description" : "Category Entry",
	"required": true,
	"type": "object",
	"properties": {
		"id":{
			"description": "ID of the Category Entry",
			"required": true,
			"type": "number",
			"example": 1337
		},
		"owner":{
			"description": "User ID of the user owning the Category Entry",
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
		'title':{
			description: 'Label for the Category',
			required: true,
			type: 'string',
			example: 'Death Star Exhaust Port Passwords'
		}
	}
};


