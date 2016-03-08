(function(){

	angular
		.module('ghost')
		.controller('EditPasswordController', EditPasswordController);
		
	function EditPasswordController(CategoryService, PasswordService, $http, $auth, $state, $stateParams, EncryptionService) {
		var self = this;

		// Quick Fix for no Passed Parameters
		if( !$stateParams.password ){
			$state.transitionTo('home');
			return;
		}

		// Text Strings
		self.text = {
			title: 'Edit password',
			submit: 'Update',
			cancel: 'Cancel'
		}

		// Literals
		self.password 		= {};
		self.submit 		= submit;
		self.title 			= "";

		// Field for the Tree-Menu to properly select the parent, when editting.
		self.selection 		= {};
		self.categories 	= [];

		// Interface
		self.treeSelect 	= treeSelect;
		self.display 		= display;

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

		// We're editing a password
		self.password 		= $stateParams.password;
		self.selection.id 	= self.password.parent;

		function treeSelect(selection){
			self.password.parent = selection.parent;
		}

		function submit(){
			PasswordService.update(self.password)
			.then(function(res){
				$state.transitionTo('home');
			}, function(err){

			});
		}

		function display(){
			// Decrypt the password
			EncryptionService.decrypt(self.password)
			.then(function(decrypted){
				self.password.password = decrypted;
			});
		}
	};
})();
