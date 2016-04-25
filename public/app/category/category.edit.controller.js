(function(){
	angular
	.module('ghost')
	.controller('EditCategoryController', EditCategoryController)

	function EditCategoryController(CategoryService, $mdDialog, $http, $auth, category){
		var self = this;

		// Literals
		self.title = "Edit Category";
		self.submitText = "Update";
		self.cancelText = "Cancel";
		self.category 	= category;
		self.categories = [];
		self.selection 	= undefined;

		// Exposed Interface
		self.treeSelect = treeSelect;
		self.cancel 	= cancel;
		self.submit 	= submit;

		// Fetch category data
		CategoryService.structure()
		.then(function(structure){
			
			var rootCat = {
				title: 'Root',
				id: null,
				children: structure,
			};

			self.selection = {};
			self.selection.id = self.category.parent;
			self.categories.push(rootCat);
		})

		// Methods
		function treeSelect(cat){
			self.category.parent = cat.id;
		}	

		function cancel(){
    		$mdDialog.cancel();
		}

		function submit(){

			CategoryService.edit(self.category)
			.then(function(res){
				$mdDialog.hide(res.data);
			}, function(err){
				console.error("Edit.Category Error: %j", err);
			})
		}

	}

})();