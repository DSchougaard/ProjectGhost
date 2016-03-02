module.exports = {
	"description" : "Category Entry",
	"required": true,
	"type": "object",
	"properties": {
		"parent":{
			"description" : "ID of the parent category",
			"required": false,
			"type": ["number", 'null'],
			"example": 1
		},
		'title':{
			description: 'Label for the Category',
			required: false,
			type: ['string', 'null'],
			example: 'Death Star Exhaust Port Passwords'
		}
	}
};


