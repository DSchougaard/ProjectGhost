(function(){

	angular
		.module('ghost')
		.controller('addController', AddController);
		
	function AddController(CategoryService, $http, $auth, $state, $stateParams, EncryptionService) {
		var self = this;

		// Text Strings
		self.text = {
			title: 'Add new password',
			submit: 'Save',
			cancel: 'Cancel'
		}


		self.password = {};
		self.title = "";
		self.categories = [];
		self.users 		= [];
		self.usernames 	= [];

		// Field for the Tree-Menu to properly select the parent, when editting.
		self.selection = {};

		// Interface
		self.treeSelect = treeSelect;
		self.submit = submit;

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
			console.log("%j", res.data)
			self.users = res.data;
			self.usernames = _.pluck(self.users, 'username');
			console.log("Usernames %j", self.usernames)
		})
		.catch(function(err){
			console.error(err);
		})	
    self.searchText = null;
    self.selectedItem = null;
self.selectedUsers = [];
		self.querySearch = querySearch;
		function querySearch (query) {
			var results = query ? self.usernames.filter(createFilterFor(query)) : [];
			return results;
		}

		function createFilterFor(query) {
			var lowercaseQuery = angular.lowercase(query);
			return function filterFn(vegetable) {
				return (angular.lowercase(vegetable).indexOf(lowercaseQuery) === 0);
			};
		}
		self.transformChip = transformChip;
		function transformChip(chip) {
		// If it is an object, it's already a known chip
		if (angular.isObject(chip)) {
			return chip;
		}
		// Otherwise, create a new one
		return { name: chip, type: 'new' }
		}

		// We're creating a new password
		self.selection.id = null;
	
		function treeSelect(selection){
			self.password.parent = selection.id;
		}

		function submit() {
			EncryptionService.encrypt(self.password)
			.then(function(encrypted){

				var password = _.clone(self.password);
				password.password = encrypted;

				return $http({
					method: 'POST',
					url: '/api/users/'+ $auth.getPayload().uid+'/passwords',
					data: password
				});
			})
			.then(function(res){
				$state.transitionTo('home');
			})
			.catch(function(err){
				console.log("AddControler Error: %j", err);

				// Handle validation errors
				if( err.data.error === "validation" ){
					
				}
				
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
	};
})();
