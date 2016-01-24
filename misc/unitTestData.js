const base64 	= require('../helpers/base64.js');
const fs 		= require('fs');
const bcrypt 	= require('bcrypt');

var privateKey = fs.readFileSync('misc/unittest-private.key');
var publicKey  = fs.readFileSync('misc/unittest-public.crt');

var userData = [
	{
		username 	: 'User1',
		password 	: 'password',
		isAdmin		: true,
		privatekey 	: base64.encode(privateKey.toString('utf8')),
		publickey 	: base64.encode(publicKey.toString('utf8'))
	},
	{
		username 	: 'User2',
		password 	: 'password',
		isAdmin		: false,
		privatekey 	: base64.encode(privateKey.toString('utf8')),
		publickey 	: base64.encode(publicKey.toString('utf8'))
	}
];

for (var i in userData) {
	userData[i].salt = bcrypt.genSaltSync();
	userData[i].password = bcrypt.hashSync(userData[i].password, userData[i].salt);
}

var passwordData = [
	{
		parent 		: null,
		owner 		: 1,
		title 		: 'SomeTitle1',
		username 	: 'SomeUser1',
		password 	: base64.encode('password'),
		iv 			: base64.encode('1111111111111111'),
		note 		: 'This is clearly a note!' 
	},
	{
		parent 		: null,
		owner 		: 1,
		title 		: 'SomeTitle2',
		username 	: 'SomeUser1',
		password 	: base64.encode('password'),
		iv 			: base64.encode('1111111111111111'),
		note 		: 'null' 

	},
	{
		parent 		: 1,
		owner 		: 1,
		title 		: 'SomeOtherTitle1.1',
		username 	: 'Doge',
		password 	: base64.encode('P@ssw0rd'),
		iv 			: base64.encode('1111111111111111'),
		note 		: 'Such password, much secure. Wow.' 

	},
	{
		parent 		: null,
		owner 		: 2,
		title 		: 'SomeTitleAgain',
		username 	: 'BadLuckBrian',
		password 	: base64.encode('password'),
		iv 			: base64.encode('1111111111111111'),
		note 		: 'Oh no... Not again...' 
	}
];


var structuresData = [
	{
		owner: 1,
		parent: null,
		title: 'How To Sith'
	},
	{
		owner: 1,
		parent: 1,
		title: 'How To Train Your Apprentice'
	},
	{
		owner: 1,
		parent: 1,
		title: 'Space and Star Destroyers'
	},
	{
		owner: 2,
		parent: null,
		title: 'Fear Is the Path to the Dark Side'
	}
];



module.exports.userData = userData;
module.exports.passwordData = passwordData;