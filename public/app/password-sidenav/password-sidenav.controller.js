(function(){
	angular
	.module('ghost')
	.controller('PasswordSideNavController', PasswordSideNavController);

	function PasswordSideNavController($rootScope, $state, $http, $auth, AuthorizationService, CategoryService, $timeout, $mdDialog){
		var self = this;

		// Literals
		self.userMenu = [];
		self.categories = [];
		self.initial = undefined;

		// Populate Menu	
		self.userMenu.push('Preferences');
		if( AuthorizationService.isAuthorized('user.list') ){
			self.userMenu.push('Users');
		}
		self.userMenu.push('Log off');

		// Exposed Interface
		self.selectMenu 	= selectMenu;
		self.treeSelect		= treeSelect;
		self.category 		= {};
		self.category.add 	= addCategory

		// Fetch content of category tree
		CategoryService.structure()
		.then(function(structure){
			console.log("%j", structure);
			var personalPasswords = {
				title: 'Personal Passwords',
				id: null,
				children: structure,
				initial:true
			};
			self.categories = [];
			self.categories.push(personalPasswords);
		})

		// Methods
		function addCategory(ev){
			$mdDialog.show({
				controller: 'CategoryController',
				controllerAs: 'vm',
				templateUrl: '/app/category/category.template.html',
				parent: angular.element(document.body),
				targetEvent: ev,
				clickOutsideToClose:true,
				fullscreen: true
			})
			.then(function(answer) {
				console.log("Created new category with id %d", answer);
				fetch();
			}, function() {
				console.log("Cancel");
			});
		}

		function selectMenu(item){
			switch(item){ 
				case 'Preferences':
					console.log("Going to User.Edit");
					$state.go('user');
					break;
				case 'Log off':
					$auth.logout();
					$state.transitionTo("login");
					break;
				case 'Users':
					$state.transitionTo('user-list');
					break;
				default:
					console.log('Invalid selection');
					break;
			};
		}

		function treeSelect(selection){
			$rootScope.$broadcast('category', selection);
		}
	};
})();


