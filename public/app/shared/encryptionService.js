(function(){

	angular
		.module('ghost')
		.service('EncryptionService', EncryptionService);


	function EncryptionService($q, $http, $auth, $mdDialog, $mdToast, $mdMedia){
		var self = this;
		// Variables
		self.encryptionKey 			= undefined;
		self.privateKey 			= undefined;
		self.publicKey 				= undefined;
		
		// Exposed Interface
		self.generateKeyPair 		= generateKeyPair;
		self.createEncryptionKey  	= createEncryptionKey;
		self.encryptPrivateKey 		= encryptPrivateKey;
		self.encryptPassword		= encryptPassword;


		self.getEncryptionKey 		= getEncryptionKey;
		self.getPublicKey 			= getPublicKey;
		self.encrypt  				= encrypt;
		self.decrypt 				= decrypt;
		self._decrypt 				= _decrypt;
		self.changeDecryptionKey 	= changeDecryptionKey;

		function generateKeyPair(){
 			var deferred = $q.defer();

			// Default RSA key length. Optional later?
			var keyLength = 4096;
			var options = {
				bits: 4096,
				e: 0x1001,
				workerScript: 'components/forge/js/prime.worker.js', // Forge SUUUUUCKS
				workers: -1
			}

			forge.pki.rsa.generateKeyPair(options, function(err, keypair) {
				if(err){
					console.error(err);
					deferred.reject(err);
				}else{
					deferred.resolve(keypair);
				}
			});
			return deferred.promise;
		};

		function createEncryptionKey(params){
			var pk_salt  = params.pk_salt  !== undefined ? params.pk_salt  : forge.random.getBytes(32);
			var password = params.password !== undefined ? params.password : params;

			var encryptionKey = forge.pkcs5.pbkdf2(password, pk_salt, 10000, 32);
			return $q.resolve( { encryptionKey: forge.util.encode64(encryptionKey), pk_salt: forge.util.encode64(pk_salt)} );
		}

		function encryptPrivateKey(key, encryptionKey, iv){
			var privateKey = key.privateKey !== undefined ? key.privateKey : key;
			iv = iv !== undefined ? iv : forge.random.getBytes(16);

			var cipher = forge.cipher.createCipher('AES-CBC', forge.util.decode64(encryptionKey));
			cipher.start({iv: iv});
			cipher.update(forge.util.createBuffer( forge.pki.privateKeyToPem(privateKey).toString('utf8') ));
			cipher.finish();

			var returnObject = {
				iv: forge.util.encode64(iv),
				privatekey: forge.util.encode64(cipher.output.getBytes())
			}
			if( key.publicKey !== undefined ){
				returnObject.publickey = forge.util.encode64( forge.pki.publicKeyToPem(key.publicKey) );
			}

			return $q.resolve(returnObject);
		}
		/*
			
			$q.all([generateKeyPair(), createEncryptionKey(..)])
			.then(function(output){
				output[0] from generateKeyPair
				output[1] from createEncryptionKey

				return encryptPrivateKey(output[0], output[1]);
			})
			.then(function(encr){
	
			});

		*/

		function decryptPrivateKey(){

		}







		function _decrypt(base64){
			return self.getEncryptionKey()
			.then(function(privatekey){

				var blob = forge.util.decode64(base64);

				// Decrypt binary password
				var decrypted = privatekey.decrypt(blob, 'RSA-OAEP', {
					md: forge.md.sha256.create()
				});

				return decrypted;
			});
		}








		function fetch(){
			return $http({
				method: 'GET',
				url: '/api/users/me'
			});
		};

		function changeDecryptionKey(password){
			return self.getEncryptionKey()
			.then(function(){
				// Generate New Decryption key
				var salt 	= forge.random.getBytes(32);
				var iv 		= forge.random.getBytes(16);

				var encryptionKey = forge.pkcs5.pbkdf2(password, salt, 10000, 32);
				var cipher = forge.cipher.createCipher('AES-CBC', encryptionKey);
				cipher.start({iv: iv});
				cipher.update(forge.util.createBuffer( forge.pki.privateKeyToPem(self.privateKey).toString('utf8') ));
				cipher.finish();

				return { 
					iv: forge.util.encode64(iv),
					pk_salt: forge.util.encode64(salt), 
					privatekey: forge.util.encode64(cipher.output.getBytes()) };

			})
		};


		function createNewEncryptionKey(){
		};

		function _encryptPrivateKey(password, key){
			var privatekey = key.privateKey !== undefined ? key.privateKey : key;

			// Generate New Decryption key
			var salt 	= forge.random.getBytes(32);
			var iv 		= forge.random.getBytes(16);

			var encryptionKey = forge.pkcs5.pbkdf2(password, salt, 10000, 32);
			var cipher = forge.cipher.createCipher('AES-CBC', encryptionKey);
			cipher.start({iv: iv});
			cipher.update(forge.util.createBuffer( forge.pki.privateKeyToPem(privatekey).toString('utf8') ));
			cipher.finish();

			return { 
				publickey: forge.util.encode64( forge.pki.publicKeyToPem(key.publicKey) ),
				iv: forge.util.encode64(iv),
				pk_salt: forge.util.encode64(salt), 
				privatekey: forge.util.encode64(cipher.output.getBytes()) };
		};

		function getEncryptionKey(){
			if( self.privateKey !== undefined ){
				return $q.resolve(self.privateKey);
			}

			// First promt user for encryption password
			return $mdDialog.show({
				parent: angular.element(document.body),
				controller: 'passwordPromtController',
				templateUrl: 'app/shared/password-promt/password-promt.template.html',
				clickOutsideToClose:true,
				fullscreen: !$mdMedia('gt-xs')
			})
			.then(function(password){

				// Query API for encryption data
				return $http({
					method: 'GET',
					url: '/api/users/me'
				})
				.then(function(res){
					// Derive User Encrypion key
					var salt = forge.util.decode64(res.data.pk_salt);
					var encryptionKey = forge.pkcs5.pbkdf2(password, salt, 10000, 32);
					self.encryptionKey = encryptionKey;

					// Decode and extract private key data from payload, and convert to buffer
					var privateKeyBinary = forge.util.decode64( res.data.privatekey );
					var privateKeyBuffer = forge.util.createBuffer( privateKeyBinary);

					// Use the derived encryption key to decrypt the privatekey
					var decipher = forge.cipher.createDecipher('AES-CBC', encryptionKey);
					decipher.start({iv: forge.util.decode64(res.data.iv) });
					decipher.update( privateKeyBuffer );
					decipher.finish();

					self.privateKey = forge.pki.privateKeyFromPem(decipher.output.data);
					self.publicKey = res.data.publickey;

					return self.privateKey;

				})
				.catch(function(err){
					console.error(err);
				    $mdDialog.show(
				        $mdDialog.alert()
			            .parent(angular.element(document.querySelector('#popupContainer')))
			            .clickOutsideToClose(true)
			            .title('Invalid decryption passphrase')
			            .textContent('The encryption passphase you entered was wrong. Please try again.')
			            .ariaLabel('Alert Wrong Decryption Passphrase')
			            .ok('OK')
			        );

			        return $q.reject("Error: " + err);
				});
			});
		};

		function getPublicKey(){
			if( self.publicKey !== undefined ){
				return $q.resolve(self.publicKey);
			}

			return fetch()
			.then(function(res){
				self.publicKey = res.data.publickey;
				return self.publicKey;
			});
		};

		function decrypt(password){
			console.warn("Deprecated Method! Decrypt is deprecated now.");
			return self.getEncryptionKey()
			.then(function(privatekey){

				// base64 deocde password
				var binaryPassword = forge.util.decode64( password.password );

				// Decrypt binary password
				var decrypted = privatekey.decrypt(binaryPassword, 'RSA-OAEP', {
					md: forge.md.sha256.create()
				});

				return decrypted;
			});
		};

		function encrypt(password){
			console.warn("Deprecated Method! Encrypt is deprecated now.");
			return self.getPublicKey()
			.then(function(key){
				var binaryPublicKey = forge.util.decode64(key);
				var publicKey = forge.pki.publicKeyFromPem(binaryPublicKey);
				
				var encrypted = publicKey.encrypt(password.password, 'RSA-OAEP', {
					md: forge.md.sha256.create()
				});

				return forge.util.encode64(encrypted);
			});
		};

		function encryptPassword(password, key){
			var binaryPublicKey = forge.util.decode64(key);
			var publicKey 		= forge.pki.publicKeyFromPem(binaryPublicKey);
			
			var encrypted 		= publicKey.encrypt(password, 'RSA-OAEP', {
				md: forge.md.sha256.create()
			});

			return forge.util.encode64(encrypted);
		}
	}

})();