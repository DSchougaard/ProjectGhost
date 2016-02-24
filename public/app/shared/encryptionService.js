(function(){

	angular
		.module('ghost')
		.service('EncryptionService', EncryptionService);


	function EncryptionService($q, $http, $auth, $mdDialog, $mdToast, $mdMedia){
		var self = this;
		// Variables
		self.encryptionKey 	= undefined;
		self.privateKey 	= undefined;
		self.publicKey 		= undefined;
		
		// Exposed Interface
		self.getPublicKey 	= getPublicKey;
		self.encrypt  		= encrypt;
		self.generateKeyPair = generateKeyPair;
		self.changeDecryptionKey = changeDecryptionKey;


		function fetch(){
			return $http({
				method: 'GET',
				url: '/api/users/me'
			});
		}

		function changeDecryptionKey(password){
			return self.getEncryptionKey()
			.then(function(){
				console.log("new password: " + password);
				console.log("%j", self.privateKey);

				// Generate New Decryption key
				var salt 	= forge.random.getBytes(32);
				var iv 		= forge.random.getBytes(16);

				var encryptionKey = forge.pkcs5.pbkdf2(password, salt, 10000, 32);
				var cipher = forge.cipher.createCipher('AES-CBC', encryptionKey);
				cipher.start({iv: iv});
				cipher.update(forge.util.createBuffer( forge.pki.privateKeyToPem(self.privateKey).toString('utf8') ));
				cipher.finish();

				console.log("Output:");
				console.log("%j", cipher.output);

				return { 
					iv: forge.util.encode64(iv),
					pk_salt: forge.util.encode64(salt), 
					privatekey: forge.util.encode64(cipher.output.getBytes()) };

			})
		}

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
					deferred.reject(err);
				}else{
					deferred.resolve(keypair);
				}
			});

		
			return deferred.promise;
		}

		self.getEncryptionKey = function(){

			console.log("Retrieving privatekey from remote server");
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

					console.log("Decrypting privatekey");

					// Use the derived encryption key to decrypt the privatekey
					var decipher = forge.cipher.createDecipher('AES-CBC', encryptionKey);
					decipher.start({iv: forge.util.decode64(res.data.iv) });
					decipher.update( privateKeyBuffer );
					decipher.finish();
					/*
					console.log("Salt = " + res.data.pk_salt);
					console.log("Encryption key = " + forge.util.encode64(encryptionKey));
					console.log("IV = " + res.data.iv);
					console.log("Private Key = " + res.data.privatekey);
					console.log(decipher.output.data);
					*/
					self.privateKey = forge.pki.privateKeyFromPem(decipher.output.data);
					self.publicKey = res.data.publickey;

					return self.privateKey;

				})
				.catch(function(err){
					console.log("Error!: " + err);
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
		}

		self.decrypt = function(password){
			console.log("Decrypting password with id %d", password.id);
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
			console.log('Encrypting password %j', password);

			return self.getPublicKey()
			.then(function(key){
				var binaryPublicKey = forge.util.decode64(key);
				var publicKey = forge.pki.publicKeyFromPem(binaryPublicKey);
				
				var encrypted = publicKey.encrypt(password.password, 'RSA-OAEP', {
					md: forge.md.sha256.create()
				});

				return forge.util.encode64(encrypted);
			});
		}
	}

})();