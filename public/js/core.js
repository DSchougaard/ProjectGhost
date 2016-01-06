var ghost = angular.module('ghost', ['ngRoute', 'ui.bootstrap']);

ghost.config(function($routeProvider, $locationProvider){
	$routeProvider
		.when('/', {
			templateUrl 		: 'views/partials/login.html',
		})
})