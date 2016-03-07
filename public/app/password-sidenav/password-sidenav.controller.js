(function(){
	angular
	.module('ghost')
	.controller('PasswordSideNavController', PasswordSideNavController);


	function PasswordSideNavController($rootScope, $state, $http, $auth, AuthorizationService, $timeout){
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


		fetch();

		// Methods
		function fetch(){
			$http({
				method: 'GET',
				url: '/api/users/' + $auth.getPayload().uid + '/categories'
			})
			.then(function(res){
				//self.categories = createStructure(res.data);
				var personalPasswords = {
					title: 'Personal Passwords',
					id: null,
					children: createStructure(res.data),
					initial:true
				};
				self.categories.push(personalPasswords);

			}, function(err){
				console.error(err);
			})
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


		function createStructure(categories){
			var map = {};
			var structure = [];

			for( var i = 0 ; i < categories.length ; i++ ){
				map[categories[i].id] = categories[i];
			}

			for( var i = 0 ; i < categories.length ; i++ ){
				// Create children list on the category
				var category = categories[i];

				// Append Values for the tree;
				category.type = 'node';

				// Create array in parent
				var parent = map[category.parent];
				if( parent !== undefined && parent !== null && category.parent !== category.id){
					// Category has a parent1
					if( parent.children === undefined ){
						parent.children = [];
					}
					parent.children.push(category);
				}else{
					// Category does not have a parent.
					structure.push(category);
				}
			}

			return structure;
		}

		function treeSelect(selection){
			$rootScope.$broadcast('category', selection);
		}

	};
})();


