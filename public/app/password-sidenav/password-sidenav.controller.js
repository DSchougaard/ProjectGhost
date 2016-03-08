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
		self.select = undefined;

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
		self.deleteCategory = deleteCategory;
		self.editCategory  	= editCategory;

		// Fetch content of category tree
		fetch();
		function fetch(){
			CategoryService.structure()
			.then(function(structure){
				console.log("%j", structure);
				var personalPasswords = {
					title: 'Personal Passwords',
					id: null,
					children: structure,
				};

				self.categories = [];
				self.categories.push(personalPasswords);
				self.select = self.cachedSelection ? self.cachedSelection : self.categories[0];
				treeSelect(self.select);
			})
		}

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

		function deleteCategory(ev){
			// Verify that the user wants to delete the category
			$mdDialog.show(
				$mdDialog.confirm()
		          .title('Are you sure you want to delete category ' + self.cachedSelection.title + '?')
		          .textContent('It is impossible to undo this action. Deleting the category will remove it permanently.')
		          .ariaLabel('Delete category')
		          .targetEvent(ev)
		          .ok('Please do it!')
		          .cancel('No thanks')
			).then(function(answer){
				// Yes, delete it
				return CategoryService.del( _.omit(self.cachedSelection, 'children') )
				.then(function(res){

				})
				.catch(function(err){
					console.log("%j", err);
					$mdDialog.show(
						$mdDialog.alert()
							.parent(angular.element(document.querySelector('#popupContainer')))
							.clickOutsideToClose(true)
							.title('Error deleting category')
							.textContent(err.data.message)
							.ariaLabel('Alert Dialog Deleting Category')
							.ok('OK')
							.targetEvent(ev)
					);
				});

			}, function(){

			});
		}

		function editCategory(ev){
			$mdDialog.show({
				controller: 'EditCategoryController',
				controllerAs: 'vm',
				templateUrl: '/app/category/category.template.html',
				parent: angular.element(document.body),
				targetEvent: ev,
				clickOutsideToClose:true,
				fullscreen: true,
				locals:{
					category: self.cachedSelection
				} 
			})
			.then(function(answer) {
				console.log("%j", answer);
				fetch();
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
			self.cachedSelection = selection;
			console.log("Caching selection %j", self.cachedSelection);
		}
	};
})();


