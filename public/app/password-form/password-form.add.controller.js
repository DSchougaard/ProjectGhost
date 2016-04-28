(function(){

	angular
		.module('ghost')
		.controller('addController', AddController);
		
	function AddController(CategoryService, $http, $auth, $state, $stateParams, EncryptionService, PasswordService, $mdMedia, $mdDialog) {
		var self = this;

		// Text Strings
		self.text = {
			title: 'Add new password',
			submit: 'Save',
			cancel: 'Cancel'
		}

		// Literals
		self.password 	= {};
		self.categories = [];
		self.sharedWith = [];
		self.users 		= [];

		// Field for the Tree-Menu to properly select the parent, when editting.
		self.selection 	= {};

		// Interface
		self.treeSelect = treeSelect;
		self.submit 	= submit;
		self.querySearch = querySearch;
		self.generatePassword = generatePassword;

		// Fetch category data
		CategoryService.structure()
		.then(function(structure){
			
			var rootCat = {
				title: 'Root',
				id: null,
				children: structure,
			};

			self.categories.push(rootCat);
		})


		$http({
			method: 'GET',
			url: '/api/users'
		})
		.then(function(res){
			self.users = res.data;
		})
		.catch(function(err){
			console.error(err);
		})	




		/*
			Begin Shamelessly stolen from https://material.angularjs.org/latest/demo/chips
		*/
		function querySearch(query) {
			var results 	= query ? self.users.filter(createFilterFor(query)) : [];
			return results;
		}
		function createFilterFor(query) {
			var lowercaseQuery = angular.lowercase(query);
			return function filterFn(user) {
				return (angular.lowercase(user.username).indexOf(lowercaseQuery) === 0);
			};
		}
		/*
			End Shamelessly stolen from https://material.angularjs.org/latest/demo/chips
		*/

		// We're creating a new password
		self.selection.id = null;
	
		function treeSelect(selection){
			self.password.parent = selection.id;
		}

		function submit() {
			EncryptionService.encrypt(self.password)
			.then(function(encrypted){

				self.password.password = encrypted;

				return $http({
					method: 'POST',
					url: '/api/users/'+ $auth.getPayload().uid+'/passwords',
					data: self.password
				});
			})
			.then(function(res){

				if( self.sharedWith.length === 0 ){
					return $state.transitionTo('home');
				}
				self.password.id = res.data.id;

				return PasswordService.sharePassword(self.password, self.sharedWith);	
			})
			.then(function(res){
				return $state.transitionTo('home');
			})
			.catch(function(err){
				console.error(err);
			});
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

		function generatePassword(){
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
			$mdDialog.show({
				controller: 'PasswordGeneratorController',
				controllerAs: 'vm',
				templateUrl: '/app/password-generator/password-generator.template.html',
				parent: angular.element(document.body),
				clickOutsideToClose:true,
				fullscreen: useFullScreen
			})
			.then(function(password){
				self.password.password = password;
			});
		}
	};
})();
