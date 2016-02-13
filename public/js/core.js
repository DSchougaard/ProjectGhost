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
        })

	/*$routeProvider
		.when('/', {
			templateUrl 	: 'views/partials/main.html',
			controller 		: 'passwordController'

		})
		.when('/login', {
			templateUrl 	: 'views/partials/login.html',
			controller 		: 'loginController'
		})
		.when('/add', {
			templateUrl 	: 'views/partials/add.html'
		});*/

    $locationProvider.html5Mode(true);

    // Config for Satellizer
    $authProvider.loginUrl = '/api/auth/login';
    $authProvider.authHeader = 'Authorization';
	$authProvider.authToken = 'Bearer';
	$authProvider.storageType = 'localStorage';


});

ghost.service('UserService', function($http, $auth, $mdDialog){
	this.privatekey = undefined;
	this.iv = undefined;

	this.get = function(){
		var userID = $auth.getPayload().uid;

		var self = this;

		$http({
			method: 'GET',
			url: '/api/users/me'
		})
		.then(function(res){
			console.log("user service got: %j", res);
			self.privatekey = res.privatekey;
			self.iv = res.iv;

			// Promt for password
			// Todo: Fix
			var password = "password";
		   	$mdDialog.show({
		      parent: angular.element(document.body),
		      controller: PasswordPromtController,
		      templateUrl: 'views/modals/password.html',
		      clickOutsideToClose:true,
		      fullscreen: true
		    })
		    .then(function(password){

		    	// HARDCODED BASE64 SALT!!
				var encryptionKey = forge.pkcs5.pbkdf2(password, salt, 10000, 32, function(err, derivedKey){

					var decipher = forge.cipher.createDecipher('AES-CBC', encryptionKey);
					decipher.start({iv: self.iv});
					console.log(self.privatekey);
					decipher.update(self.privatekey);
					decipher.finish();

					console.log(decipher.output.toHex());


				});
		    });
		});
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

ghost.controller('homeController', function($scope, $http, $auth, $location, $state, UserService){

	$scope.entries = [];

	var userID = $auth.getPayload().uid;

	$http({
		method: 'GET',
		url: '/api/users/' + userID + '/passwords'
	})
	.then(function(res){
		$scope.entries = res.data;
		console.log("%j", res.data);
	}, function(err){
		console.log("%j", err);
	});

	$scope.openNav = function(){
    	$mdSidenav('left').toggle();
	}

	$scope.logout = function(){
		$auth.logout();
		$state.transitionTo("login");
	}

	$scope.test = function(){
	UserService.get();
	}

	// List
	$scope.selectedIndex = undefined;
	$scope.select = function(index, event){
		console.log("Event = %j" , event);
		if(index !== $scope.selectedIndex){
			$scope.selectedIndex = index;
		}else {
			$scope.selectedIndex = undefined;
		}
	}

	$scope.get = function(id){
		console.log("GOT " + id);
	}


})