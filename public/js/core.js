var ghost = angular.module('ghost', ['ngMaterial', 'satellizer', 'ui.router']);

ghost.config(function($locationProvider, $authProvider, $stateProvider, $urlRouterProvider){
    
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
    });

    $locationProvider.html5Mode(true);

    // Config for Satellizer
    $authProvider.loginUrl 		= '/api/auth/login';
    $authProvider.authHeader 	= 'Authorization';
	$authProvider.authToken 	= 'Bearer';
	$authProvider.storageType 	= 'localStorage';
});

ghost.controller('toolbarController', function($scope, $mdSidenav){
	$scope.menu = function(){
		$mdSidenav('left').toggle();
	}
})

ghost.service('EncryptionService', function($q, $http, $auth, $mdDialog, $mdToast){
	var self = this;

	this.encryptionKey = undefined;
	this.privatekey = undefined;

	this.getEncryptionKey = function(){

		console.log("Retrieving privatekey from remote server");
		if( self.privatekey !== undefined ){
			return $q.resolve(self.privatekey);
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
				self.privatekey = forge.pki.privateKeyFromPem(decipher.output.data);
				return self.privatekey;

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

	this.decrypt = function(password){
		console.log("Decrypting password with id %d", password.id);
		return this.getEncryptionKey()
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
});

ghost.service('PasswordService', function($rootScope, $q, $http, $auth, $mdDialog, EncryptionService){
	// I hate JS's version of "this"
	var self = this;

	// Content for storing the actual passwords
	this.passwords = [];

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