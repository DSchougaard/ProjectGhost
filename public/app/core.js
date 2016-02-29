(function(){

	var ghost = angular.module('ghost', ['ngMaterial', 'ngMessages', 'md.data.table', 'satellizer', 'ui.router', 'qAllSettled']);

	ghost.config(function($locationProvider, $authProvider, $stateProvider, $urlRouterProvider, $mdThemingProvider, $mdIconProvider){
	    
	    $urlRouterProvider.otherwise('/');
	   
	    // HOME STATES AND NESTED VIEWS ========================================
	   	/*
	    .state('home1', {
	        url: '/',
			authenticate: true,
			views: {
				'content':{
			        templateUrl: 'app/password-list/password-list.template.html',
       				controller: 'listController',
	        		controllerAs: 'vm',
				}, 
				'toolbar':{
			        templateUrl: 'app/toolbar/toolbar.template.html',
       				controller: 'ToolBarController',
	        		controllerAs: 'vm',
				}
			}
	    })*/
		$stateProvider
	    .state('home', {
	    	url:'/',
	    	views: {
				'toolbar':{
			        templateUrl: 'app/toolbar/toolbar.template.html',
       				controller: 'ToolBarController',
	        		controllerAs: 'vm',
				},
				'content': {
			        templateUrl: 'app/password-list/password-list.template.html',
       				controller: 'listController',
	        		controllerAs: 'vm'
	    		},
	    		'sidenav@home': {
	    			templateUrl: 'app/password-sidenav/password-sidenav.template.html',
	    			controller: 'PasswordSideNavController',
	    			controllerAs: 'vm'
	    		}
	    	}
	    })

	    // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
	    .state('login', {
	    	url: '/login',
			views: {
				'content':{
					templateUrl 	: 'app/login/login.template.html',
					controller 		: 'loginController'
				}
			}
	    })
	    .state('logout', {
	    	controller: 'logoutController'
	    })
	    .state('add', {
	    	url: '/add',
	    	authenticate: true,
	    	views: {
	    		'content':{
			    	templateUrl: 'app/password-form/password-form.template.html',
  	 				controller: 'addController',
	   		 		controllerAs: 'vm'
	    		},
				'toolbar':{
			        templateUrl: 'app/toolbar/toolbar.template.html',
       				controller: 'ToolBarController',
	        		controllerAs: 'vm',
				}
	    	}
	    })
	    .state('edit', {
	    	url: '/edit',
	    	authenticate: true,
	    	authorization: 2,
	    	views: {
	    		'content': {
			    	templateUrl: 'app/password-form/password-form.template.html',
	    			controller: 'addController',
	    			controllerAs: 'vm',
	    		},
				'toolbar':{
			        templateUrl: 'app/toolbar/toolbar.template.html',
       				controller: 'ToolBarController',
	        		controllerAs: 'vm',
				}
	    	},
	    	params: {
	    		password: undefined
	    	}
	    })
	    .state('user', {
	    	url: '/user',
	    	authenticate: true,
	    	views: {
	    		'content': {
	    			templateUrl: 'app/user/user.template.html',
	    			controller: 'UserController',
	    			controllerAs: 'vm'
	    		},
	    		'toolbar': {
			        templateUrl: 'app/toolbar/toolbar.template.html',
       				controller: 'ToolBarController',
	        		controllerAs: 'vm',
	    		}
	    	}
	    })
	    .state('user-list', {
	    	url: '/users',
	    	authenticate: true,
	    	views: {
	    		'toolbar': {
			        templateUrl: 'app/toolbar/toolbar.template.html',
       				controller: 'ToolBarController',
	        		controllerAs: 'vm',
	    		},
	    		'content': {
	    			templateUrl: 'app/user-list/user-list.template.html',
	    			controller: 'UserListController',
	    			controllerAs: 'vm'
	    		}
	    		
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
		// Tree Icons
		.icon('tree:folder', 			'img/icons/tree/folder.svg')
		.icon('tree:folder-expanded', 	'img/icons/tree/folder-expanded.svg')
		.icon('tree:file', 				'img/icons/tree/file.svg')
		.icon('back-white', 			'img/icons/back-white.svg')
		.icon('back-black', 			'img/icons/back-black.svg')
		.icon('search-white', 			'img/icons/search-white.svg')
		.icon('search-black', 			'img/icons/search-black.svg')
		.icon('close-white', 			'img/icons/close-white.svg')
		.icon('close-black', 			'img/icons/close-black.svg')
		.icon('edit-white', 			'img/icons/edit-white.svg')
		.icon('edit-black', 			'img/icons/edit-black.svg')
		.icon('delete-white', 			'img/icons/delete-white.svg')
		.icon('delete-black', 			'img/icons/delete-black.svg')



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