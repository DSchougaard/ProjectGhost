module.exports = {
	"description" : "Category Entry",
	"required": true,
	"type": "object",
	"properties": {
		"owner":{
			"description": "User ID of the user owning the Category Entry",
			"required":true,
			"type": ["number", 'string'],
			"pattern":/[0-9]+/,
			"example":1
		},
		"parent":{
			"description" : "ID of the parent category",
			"required": true,
			"type": ["number", 'null', 'string'],
			"pattern":/[0-9]+/,
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


