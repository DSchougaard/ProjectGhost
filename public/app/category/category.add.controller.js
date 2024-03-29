(function(){
	angular
	.module('ghost')
	.controller('AddCategoryController', AddCategoryController)

	function AddCategoryController(CategoryService, $mdDialog, $http, $auth){
		var self = this;

		self.category = {};
		self.categories = [];
		self.title = "Create New Category";
		self.submitText = "Save";
		self.cancelText = "Cancel";

		// Exposed Interface
		self.treeSelect = treeSelect;
		self.submit = submit;
		self.cancel = cancel;


		CategoryService.structure()
		.then(function(structure){
			var rootCat = {
				title: 'Root',
				id: null,
				children: structure,
				initial:true
			};
			self.categories.push(rootCat);
		})
		.catch(function(err){
			$mdDialog.show(
				$mdDialog.alert()
				.clickOutsideToClose(true)
				.title('An error occured while retrieving categories')
				.textContent(err)
				.ariaLabel('Add Category Alert')
				.ok('OK')
			);		
		})

		function cancel(){
   			$mdDialog.cancel();
		}

		function submit(){
			$http({
				method: 'POST',
				url: '/api/users/' + $auth.getPayload().uid + '/categories',
				data: self.category
			})
			.then(function(res){
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