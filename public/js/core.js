(function(){

	var ghost = angular.module('ghost', ['ngMaterial', 'satellizer', 'ui.router']);

	ghost.config(function($locationProvider, $authProvider, $stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider){
	    
	    $urlRouterProvider.otherwise('/login');
	   
	    $stateProvider
	    // HOME STATES AND NESTED VIEWS ========================================
	    .state('home', {
	        url: '/',
			authenticate: true,
			views: {
				'content':{
			        templateUrl: 'views/partials/main.html',
       				controller: 'listController',
	        		controllerAs: 'vm',
				},
				'sidenav':{
			        templateUrl: 'toolbar/toolbar.template.html',
       				controller: 'ToolBarController',
	        		controllerAs: 'vm',
				}
			}
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
	    	views: {
	    		'content':{
			    	templateUrl: 'views/partials/add.html',
  	 				controller: 'addController',
	   		 		controllerAs: 'vm'
	    		},
				'sidenav':{
			        templateUrl: 'toolbar/toolbar.template.html',
       				controller: 'ToolBarController',
	        		controllerAs: 'vm',
				}
	    	}
	    })
	    .state('edit', {
	    	url: '/edit',
	    	views: {
	    		'content': {
			    	templateUrl: 'views/partials/add.html',
	    			controller: 'addController',
	    			controllerAs: 'vm',
	    		},
				'sidenav':{
			        templateUrl: 'toolbar/toolbar.template.html',
       				controller: 'ToolBarController',
	        		controllerAs: 'vm',
				}
	    	},
	    	params: {
	    		password: undefined
	    	}
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

	ghost.run(function ($rootScope, $state, $auth) {
		$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
			if (toState.authenticate && !$auth.isAuthenticated()){
				// User isn’t authenticated
				$state.transitionTo("login");
				event.preventDefault(); 
			}
		});
	});


	ghost.controller('logoutController', function($auth){
		if( $auth.isAuthenticated() ){
			$auth.logout();
			console.log('Auth token removed');
		}
	});

})();