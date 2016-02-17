var ghost = angular.module('ghost', ['ngMaterial', 'satellizer', 'ui.router']);

ghost.config(function($locationProvider, $authProvider, $stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider){
    
    $urlRouterProvider.otherwise('/login');
   
    $stateProvider
    // HOME STATES AND NESTED VIEWS ========================================
    .state('home', {
        url: '/',
        templateUrl: 'views/partials/main.html',
        controller: 'listController',
        controllerAs: 'vm',
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

	// Angular Material Icon Proivder Setup
	$mdIconProvider
	.icon('add', 'img/icons/add.svg')
	.icon('menu', 'img/icons/menu.svg')
	.icon('toggle-arrow-up', 'img/icons/toggle-arrow-up.svg')
	.icon('toggle-arrow-down', 'img/icons/toggle-arrow-down.svg')
});

ghost.run(function($http, $templateCache){
	// Pre-fetch icons sources by URL and cache in the $templateCache...
	// subsequent $http calls will look there first.
	var urls = [ 
		'img/icons/add.svg', 
		'img/icons/menu.svg', 
		'img/icons/toggle-arrow-up.svg',
		'img/icons/toggle-arrow-down.svg'];
	

	angular.forEach(urls, function(url) {
		$http.get(url, {cache: $templateCache});
	});
});


ghost.controller('toolbarController', function($scope, $mdSidenav){
	$scope.menu = function(){
		$mdSidenav('left').toggle();
	}
})



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
