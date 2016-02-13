const base64 	= require('../helpers/base64.js');
const fs 		= require('fs');
const bcrypt 	= require('bcrypt');
var forge = require('node-forge');

var privateKey = fs.readFileSync('misc/unittest-private.key');
var publicKey  = fs.readFileSync('misc/unittest-public.crt');

var userData = [
	{
		username 	: 'User1',
		isAdmin		: true,
		salt 		: '$2a$10$823g2vH0BRk90.Moj9e5Fu',
		password 	: '$2a$10$823g2vH0BRk90.Moj9e5Fu.gVB0X5nuZWT1REbTRHpdeH4vwLAYVC',
		privatekey 	: base64.encode(privateKey.toString('utf8')),
		iv 			: "woDDiR/DmsKtSgkQwqXDp2zDlMOCwpDCqXk=",
		pk_salt 	: "Gvfqk3Dp/ezVweCxJ1BZgDADKWHDQGhy7tyEU5p+p3kZ9N8eWcPTEfLXqplZA5WVqMbLB3slU47jPXnj4krRDywT6CnK096wWP7Mc3khwlaRFLyjnf0u3TD9hs0udc194JwYXq0fAuzvM36iKlpXeGFDBVtP4NZV/7OIJX1LBkI=",
		publickey 	: base64.encode(publicKey.toString('utf8'))
	},
	{
		username 	: 'User2',
		isAdmin		: false,
		salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
		password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
		privatekey 	: base64.encode(privateKey.toString('utf8')),
		iv 			: "woDDiR/DmsKtSgkQwqXDp2zDlMOCwpDCqXk=",
		pk_salt 	: "Gvfqk3Dp/ezVweCxJ1BZgDADKWHDQGhy7tyEU5p+p3kZ9N8eWcPTEfLXqplZA5WVqMbLB3slU47jPXnj4krRDywT6CnK096wWP7Mc3khwlaRFLyjnf0u3TD9hs0udc194JwYXq0fAuzvM36iKlpXeGFDBVtP4NZV/7OIJX1LBkI=",
		publickey 	: base64.encode(publicKey.toString('utf8'))
	}
];

var categoryData = [
	{
		owner: 1,
		parent: null,
		label: 'Category1'
	},
	{
		owner: 1,
		parent: null,
		label: 'Category2'
	},
	{
		owner: 1,
		parent: 1,
		label: 'Category1.1'
	}
]

var passwordData = [
	{
		parent 		: null,
		owner 		: 1,
		title 		: 'SomeTitle1',
		username 	: 'SomeUser1',
		password 	: base64.encode('password'),
		note 		: 'This is clearly a note!',
		url 		: null
	},
	{
		parent 		: null,
		owner 		: 1,
		title 		: 'SomeTitle2',
		username 	: 'SomeUser1',
		password 	: base64.encode('password'),
		note 		: 'null',
		url 		: null

	},
	{
		parent 		: 1,
		owner 		: 1,
		title 		: 'SomeOtherTitle1.1',
		username 	: 'Doge',
		password 	: base64.encode('P@ssw0rd'),
		note 		: 'Such password, much secure. Wow.',
		url 		: null

	},
	{
		parent 		: null,
		owner 		: 2,
		title 		: 'SomeTitleAgain',
		username 	: 'BadLuckBrian',
		password 	: base64.encode('password'),
		note 		: 'Oh no... Not again...',
		url 		: null
	}
];


console.log("Generating RSA keypairs...");
var keypair = forge.pki.rsa.generateKeyPair({bits: 1024, e: 0x10001});
userData[0].publickey = keypair.publicKey;
userData[0].privatekey= keypair.privateKey;

keypair = forge.pki.rsa.generateKeyPair({bits: 1024, e: 0x10001});
userData[1].publickey = keypair.publicKey;
userData[1].privatekey= keypair.privateKey;
console.log("Done!");

console.log( forge.pki.privateKeyToPem(userData[1].privatekey) );









var salt 		= base64.decode(userData[0].pk_salt);
var derivedKey 	= forge.pkcs5.pbkdf2('password', salt, 10000, 32);

var cipher 		= forge.cipher.createCipher('AES-CBC', derivedKey);
cipher.start({iv: base64.decode(userData[0].iv)});
cipher.update(forge.util.createBuffer(privateKey));
cipher.finish();

userData[0].privatekey = base64.encode(cipher.output);




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
module.exports.categoryData = categoryData;
module.exports.passwordData = passwordData;