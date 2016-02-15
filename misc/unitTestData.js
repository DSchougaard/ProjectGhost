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
		iv 			: "X6MCzUw66oDIEa7qnUJ2hg==",
		pk_salt 	: "srZMJkJ87zbFLxuOcQdHj7dcY1YNu/ggb9ZtkjGOxnc=",
		publickey 	: base64.encode(publicKey.toString('utf8'))
	},
	{
		username 	: 'User2',
		isAdmin		: false,
		salt 		: '$2a$10$n9ecPHPXJC3UWkMLBBihNO',
		password 	: '$2a$10$n9ecPHPXJC3UWkMLBBihNOJ/OIX8P5s3g0QU8FjDTJkjFrHqdptEe',
		privatekey 	: base64.encode(privateKey.toString('utf8')),
		iv 			: "jGyE4wPElof3fh1pF3M3tQ==",
		pk_salt 	: "VbSiJrVnzvwEgcnOIbuCb6/OSZxOoTfTinPoMGQfIj4=",
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
];

var passwordData = [
	{
		parent 		: null,
		owner 		: 1,
		title 		: 'SomeTitle1',
		username 	: 'SomeUser1',
		password 	: 'password',
		note 		: 'This is clearly a note!',
		url 		: null
	},
	{
		parent 		: null,
		owner 		: 1,
		title 		: 'SomeTitle2',
		username 	: 'SomeUser1',
		password 	: 'password',
		note 		: 'null',
		url 		: null

	},
	{
		parent 		: 1,
		owner 		: 1,
		title 		: 'SomeOtherTitle1.1',
		username 	: 'Doge',
		password 	: 'P@ssw0rd',
		note 		: 'Such password, much secure. Wow.',
		url 		: null

	},
	{
		parent 		: null,
		owner 		: 2,
		title 		: 'SomeTitleAgain',
		username 	: 'BadLuckBrian',
		password 	: 'password',
		note 		: 'Oh no... Not again...',
		url 		: null
	}
];

/*
var iv = forge.random.getBytesSync(16);
console.log( forge.util.encode64(iv));

var privateKeySalt = forge.random.getBytes(32);
console.log( forge.util.encode64(privateKeySalt));
*/

/*
var keypair = forge.rsa.generateKeyPair({bits: 4096, e: 0x10001});
console.log(forge.pki.publicKeyToPem(keypair.publicKey));
console.log(forge.pki.privateKeyToPem(keypair.privateKey));
*/

//forge.util.bytesToHex(salt);
//forge.util.hexToBytes(hex);

var salts = [];
var encryptionKeys = [];

//salts[0] 			= forge.util.hexToBytes(userData[0].pk_salt);
salts[0] 			= forge.util.decode64(userData[0].pk_salt);
encryptionKeys[0] 	= forge.pkcs5.pbkdf2( "encryptionpassword", salts[0], 10000, 32);
//salts[1] 			= forge.util.hexToBytes(userData[1].pk_salt);
salts[1] 			= forge.util.decode64(userData[1].pk_salt) ; 
encryptionKeys[1] 	= forge.pkcs5.pbkdf2("encryptionpassword", salts[1], 10000, 32);

var ciphers 		= [];
var encrypteds 		= [];


ciphers[0] = forge.cipher.createCipher('AES-CBC', encryptionKeys[0]);
ciphers[0].start({iv: forge.util.decode64(userData[0].iv) });
ciphers[0].update(forge.util.createBuffer(privateKey.toString('utf8')));
ciphers[0].finish();
// Load BASE64 encoded private key into userdata.
userData[0].privatekey = forge.util.encode64(ciphers[0].output.getBytes());
userData[0].publickey  = forge.util.encode64(publicKey.toString('utf8'));

console.log("Salt = " + userData[0].pk_salt);
console.log("Encryption key = " + forge.util.encode64(encryptionKeys[0]));
console.log("IV = " + userData[0].iv);
console.log("Private Key = " + userData[0].privatekey);




ciphers[1] = forge.cipher.createCipher('AES-CBC', encryptionKeys[1]);
ciphers[1].start({iv: forge.util.decode64(userData[1].iv) });
ciphers[1].update(forge.util.createBuffer(privateKey));
ciphers[1].finish();

userData[1].privatekey = forge.util.encode64(ciphers[1].output.getBytes());
userData[1].publickey  = forge.util.encode64(publicKey.toString('utf8'));


var bytePublicKeys = [];
bytePublicKeys[0]  = forge.pki.publicKeyFromPem(publicKey);
bytePublicKeys[1]  = forge.pki.publicKeyFromPem(publicKey);

var encryted;
// Encrypt test keys for User1
encrypted = bytePublicKeys[0].encrypt(passwordData[0].password, 'RSA-OAEP', {
  md: forge.md.sha256.create()
});
passwordData[0].password = forge.util.encode64(encrypted);

encrypted = bytePublicKeys[0].encrypt(passwordData[1].password, 'RSA-OAEP', {
  md: forge.md.sha256.create()
});
passwordData[1].password = forge.util.encode64(encrypted);

encrypted = bytePublicKeys[0].encrypt(passwordData[2].password, 'RSA-OAEP', {
  md: forge.md.sha256.create()
});
passwordData[2].password = forge.util.encode64(encrypted);

// Encrypt test keys for User2
encrypted = bytePublicKeys[1].encrypt(passwordData[3].password, 'RSA-OAEP', {
  md: forge.md.sha256.create()
});
passwordData[3].password = forge.util.encode64(encrypted);





//console.log( forge.util.encode64( encrypted.getBytes() ) );


/*
var decipher = forge.cipher.createDecipher('AES-CBC', encryptionKeys[0]);
decipher.start({iv: forge.util.hexToBytes(userData[0].iv) });
decipher.update(encrypted);
decipher.finish();
// outputs decrypted hex

var test = forge.pki.privateKeyFromPem(decipher.output);
*/



/*
console.log("Generating RSA keypairs...");
var keypair = forge.pki.rsa.generateKeyPair({bits: 1024, e: 0x10001});
userData[0].publickey = keypair.publicKey;
userData[0].privatekey= keypair.privateKey;

keypair = forge.pki.rsa.generateKeyPair({bits: 1024, e: 0x10001});
userData[1].publickey = keypair.publicKey;
userData[1].privatekey= keypair.privateKey;
console.log("Done!");

console.log( ( keypair.privateKey ) );
*/

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