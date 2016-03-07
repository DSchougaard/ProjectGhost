(function(){
	angular
	.module('ghost')
	.controller('CategoryController', CategoryController)

	function CategoryController(CategoryService, $mdDialog, $http, $auth){
		var self = this;

		self.category = {};
		self.categories = [];

		// Exposed Interface
		self.treeSelect = treeSelect;
		self.submit = submit;
		self.cancel = cancel;

		$http({
			method: 'GET',
			url: '/api/users/' + $auth.getPayload().uid + '/categories'
		})
		.then(function(res){
			//self.categories = createStructure(res.data);
			var rootCat = {
				title: 'Root',
				id: null,
				children: createStructure(res.data),
				initial:true
			};
			self.categories.push(rootCat);
		}, function(err){
			$mdDialog.show(
				$mdDialog.alert()
				.clickOutsideToClose(true)
				.title('An error occured while retrieving categories')
				.textContent(err.body)
				.ariaLabel('Add Category Alert')
				.ok('OK')
			);		
		})

		function cancel(){
			$mdDialog.cancel()
		}

		function submit(){
			$http({
				method: 'POST',
				url: '/api/users/' + $auth.getPayload().uid + '/categories',
				data: self.category
			})
			.then(function(res){
				console.log("Created category");
				console.log("%j", res);
				$mdDialog.hide(res.data);
			}, function(err){
				$mdDialog.show(
					$mdDialog.alert()
					.clickOutsideToClose(true)
					.title('An error occured')
					.textContent(err.body)
					.ariaLabel('Add Category Alert')
					.ok('OK')
				);
			})
		}

		function createStructure(categories){
			console.log("Creating tree structure..");
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

		function treeSelect(category){
			self.category.parent = category.id;
		}	
	}

})();