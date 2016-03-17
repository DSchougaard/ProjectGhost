

module.exports = {
	"description" : "Invite",
	"required": true,
	"type": "object",
	"properties": {
		"expires":{
			"description" : "UNIX moment when the invite will expire",
			"required": true,
			"type": 'number',
			"example": 1
		},
		'link':{
			"description": 'UUID link for the invite',
			"required": true,
			"type": 'string',
			"pattern": /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			"example": 'de305d54-75b4-431b-adb2-eb6b9e546014'
		},
		'used':{
			"description": 'Denotes if the invite has previously been used or not',
			"required": true,
			"type": 'boolean',
			"example": false
		}
	}
};


