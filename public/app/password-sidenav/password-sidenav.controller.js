(function(){
	angular
	.module('ghost')
	.controller('PasswordSideNavController', PasswordSideNavController);

	function PasswordSideNavController($rootScope, $state, $http, $auth, AuthorizationService, CategoryService, UserService, $timeout, $mdDialog, PasswordGeneratorService){
		var self = this;

		// Literals
		self.userMenu = [];
		self.categories = [];
		self.initial = undefined;
		self.select = undefined;

		self.username = UserService.username;

		UserService.get()
		.then(function(data){
			self.username = UserService.username;
		});

		// Populate Menu	
		self.userMenu.push('Preferences');
		if( AuthorizationService.isAuthorized('user.list') ){
			self.userMenu.push('Users');
			self.userMenu.push('Invite User');
		}
		self.userMenu.push('Audit');
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
				var personalPasswords = {
					title: 'Personal Passwords',
					id: null,
					children: structure,
				};

				var sharedPasswords = {
					title: 'Shared Passwords',
					id: -1,
					children: []
				}

				self.categories = [];
				self.categories.push(personalPasswords);
				self.categories.push(sharedPasswords);
				self.select = self.cachedSelection ? self.cachedSelection : self.categories[0];
				treeSelect(self.select);
			}) 
		}

		// Methods
		function addCategory(ev){
			$mdDialog.show({
				controller: 'AddCategoryController',
				controllerAs: 'vm',
				templateUrl: '/app/category/category.template.html',
				parent: angular.element(document.body),
				targetEvent: ev,
				clickOutsideToClose:true,
				fullscreen: true
			})
			.then(function(answer) {
				fetch();
			}, function() {
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
		          .ok('Yes, delete category')
		          .cancel('No thanks')
			).then(function(answer){
				// Yes, delete it
				return CategoryService.del( _.omit(self.cachedSelection, 'children') )
				.then(function(res){
					fetch();
				})
				.catch(function(err){
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
					category: _.pick(self.cachedSelection, ['id', 'parent', 'title'])
				} 
			})
			.then(function(answer) {
				fetch();
			});
		}

		function selectMenu(item){
			switch(item){ 
				case 'Preferences':
					$state.go('user');
					break;
				case 'Log off':
					$auth.logout();
					$state.transitionTo("login");
					break;
				case 'Users':
					$state.transitionTo('user-list');
					break;
				case 'Audit':
					$state.transitionTo('audit');
					break;
				case 'Invite User':
					$state.transitionTo('invite');
					break;
				default:
					console.error('Invalid selection');
					break;
			};
		}

		function treeSelect(selection){
			$rootScope.$broadcast('category', selection);
			self.cachedSelection = selection;
		}
	};
})();


