var ghost = angular.module('ghost', ['ngMaterial', 'satellizer', 'ui.router']);

ghost.config(function($locationProvider, $authProvider, $stateProvider, $urlRouterProvider, $mdThemingProvider){
    
    $urlRouterProvider.otherwise('/login');
   
    $stateProvider
    // HOME STATES AND NESTED VIEWS ========================================
    .state('home', {
        url: '/',
        templateUrl: 'views/partials/main.html',
        controller: 'homeController',
		authenticate: true
    })
    
    // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
    .state('login', {
    	url: '/login',
		templateUrl 	: 'views/partials/login.html',
		controller 		: 'loginController'
    })
    .state('logout', {
    	controller: 'logoutController'
    })
    .state('add', {
    	url: '/add',
    	templateUrl: 'views/partials/add.html',
    	controller: 'addController',
    	controllerAs: 'vm'
    });

    $locationProvider.html5Mode(true);

    // Config for Satellizer
    $authProvider.loginUrl 		= '/api/auth/login';
    $authProvider.authHeader 	= 'Authorization';
	$authProvider.authToken 	= 'Bearer';
	$authProvider.storageType 	= 'localStorage';


	// Angular Material Config
 	//$mdThemingProvider.theme('default').dark();
	$mdThemingProvider.theme('default')
		.primaryPalette('blue-grey')
		.accentPalette('deep-orange');
});

ghost.controller('toolbarController', function($scope, $mdSidenav){
	$scope.menu = function(){
		$mdSidenav('left').toggle();
	}
})

ghost.service('EncryptionService', function($q, $http, $auth, $mdDialog, $mdToast){
	var self = this;
	// Variables
	self.encryptionKey 	= undefined;
	self.privateKey 	= undefined;
	self.publicKey 		= undefined;
	// Methods
	self.getPublicKey 	= getPublicKey;
	self.encrypt  		= encrypt;

	function fetch(){
		return $http({
			method: 'GET',
			url: '/api/users/me'
		});
	}

	self.getEncryptionKey = function(){

		console.log("Retrieving privatekey from remote server");
		if( self.privateKey !== undefined ){
			return $q.resolve(self.privateKey);
		}

		// First promt user for encryption password
		return $mdDialog.show({
			parent: angular.element(document.body),
			controller: PasswordPromtController,
			templateUrl: 'views/modals/password.html',
			clickOutsideToClose:true,
			fullscreen: true
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
		console.log('Encrypting password');

		return self.getPublicKey()
		.then(function(key){
			console.log("Private key = ", key);


			var binaryPublicKey = forge.util.decode64(key);
			var publicKey = forge.pki.publicKeyFromPem(binaryPublicKey);

			var encrypted = publicKey.encrypt(password, 'RSA-OAEP', {
				md: forge.md.sha256.create()
			});

			return forge.util.encode64(encrypted);
		});
	}
});

ghost.service('PasswordService', function($rootScope, $q, $http, $auth, $mdDialog, EncryptionService){
	// I hate JS's version of "this"
	var self = this;

	// Content for storing the actual passwords
	this.passwords 	= [];
	this.create 	= create;

	this.fetch = function(){
		$http({
			method: 'GET',
			url: '/api/users/' + $auth.getPayload().uid + '/passwords'
		})
		.then(function(res){
			self.passwords = _.clone(res.data);
			console.log("Passwords updated.\n%j", self.passwords);
			$rootScope.$broadcast('passwords', 'fetched');
		})
		.catch(function(err){
		    $mdDialog.show(
		        $mdDialog.alert()
	            .parent(angular.element(document.querySelector('#popupContainer')))
	            .clickOutsideToClose(true)
	            .title('Error retrieving passwords')
	            .textContent(err)
	            .ariaLabel('Alert retrieve')
	            .ok('OK')
	        );
		});
	}

	this.show = function(index){
		console.log("Password Service: Showing password with ID %d, resolving to %j", index, this.passwords[index])
		return EncryptionService.decrypt(this.passwords[index])
		.then(function(password){

			self.passwords[index].decryptedPassword = password;

		});
	};

	this.hide = function(index){
		self.passwords[index].decryptedPassword = undefined;
	}

	function create(password){


	};

});

function PasswordPromtController($scope, $mdDialog){
	$scope.password = undefined;
	$scope.cancel = function(){
		$mdDialog.cancel();
	}

	$scope.submit = function(){
		$mdDialog.hide($scope.password);
	}
}


ghost.run(function ($rootScope, $state, $auth) {
	$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
		if (toState.authenticate && !$auth.isAuthenticated()){
			// User isn’t authenticated
			$state.transitionTo("login");
			event.preventDefault(); 
		}
	});
});


ghost.controller('loginController', function($scope, $auth, $location, $state){
	$scope.alerts = [];

	$scope.auth = function(){
		// When submitting make sure that alerts arent stacked
		$scope.alerts = [];

		// Perform login
		$auth.login($scope.user)
		.then(function(res){
			// Change location to main page
			$state.transitionTo("home");
		})
		.catch(function(err){
			if( err.status === 401 ){
				// Login credentials was wrong
				$scope.alerts.push({type: 'danger', message: 'Invalid login'});
			}
		});
	}

	$scope.closeAlert = function(index){
		$scope.alerts.splice(index, 1);
	}
});

ghost.controller('logoutController', function($auth){
	if( $auth.isAuthenticated() ){
		$auth.logout();
		console.log('Auth token removed');
	}
});

ghost.controller('homeController', function($scope, $http, $auth, $location, $state, PasswordService, EncryptionService){

	$scope.entries = [];

	var userID = $auth.getPayload().uid;



	$scope.entries = PasswordService.passwords;
	PasswordService.fetch();


	// Method for determining wheter or not a field is shown	
	$scope.isVisible = function(value){
		return (
			value !== '' &&
			value !== null &&
			value !== undefined
			);
	}




	$scope.$on('passwords', function(res){
		$scope.entries = PasswordService.passwords;
	});

	$scope.openNav = function(){
    	$mdSidenav('left').toggle();
	}

	$scope.logout = function(){
		$auth.logout();
		$state.transitionTo("login");
	}

	// List controls
	$scope.selectedIndex = undefined;
	$scope.select = function(index, event){
		if( $scope.selectedIndex !== undefined && index !== $scope.selectedIndex ){
			// Hide previously shown password, when it looses focus.
			PasswordService.hide($scope.selectedIndex);
		}

		if(index !== $scope.selectedIndex){
			$scope.selectedIndex = index;
		}else {
			$scope.selectedIndex = undefined;
		}
	}

	$scope.decrypt = function(index){
		EncryptionService.decrypt( $scope.entries[index] )
		.then(function(password){
			console.log("Decrypted password = " + password);
			this.reload();
		});
	}

	$scope.show = function(index){
		PasswordService.show(index)
		.then(function(){
		})
	}

	$scope.hide = function(index){
		PasswordService.hide(index);
	}

})

