(function(){

	angular
		.module('ghost')
		.controller('EditSharedPasswordController', EditSharedPasswordController);
		
	function EditSharedPasswordController($q, CategoryService, PasswordService, $http, $auth, $state, $stateParams, EncryptionService,$mdMedia, $mdDialog) {
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
		self.password 		= $stateParams.password;
		console.log("Title= %j", self.password)
		self.passwordClone 	= _.clone($stateParams.password);
		self.submit 		= submit;
		self.title 			= "";
		self.decryptEnabled = true;
		self.passwordDecrypted = false;

		// DOM config
		self.dom 			= {};
		self.dom.config 	= {
			locked: {
				title		: true,
				username	: true,
				password	: true,
				url			: true,
				note		: true,
				category	: false,
				shared		: true
			},
			visible: {
				title		: true,
				username	: true,
				password	: true,
				url			: true,
				note		: true,
				category	: true,
				shared		: false
			}
		}


		// Lists for managing sharing
		self.users 			= [];
		self.oldSharedWith 	= [];
		self.sharedWith 	= [];
		
		// Field for the Tree-Menu to properly select the parent, when editting.
		self.selection 		= {};
		self.categories 	= [];
		self.selection.id 	= self.password.parent;

		// Interface
		self.treeSelect 	= treeSelect;
		self.display 		= display;
		self.querySearch 	= querySearch;
		self.generatePassword = generatePassword;

	
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

		function treeSelect(selection){
			self.password.parent = selection.id;
		}

		function submit(){

			var payload = {};

			if( self.password.parent === self.passwordClone.parent ){
				$state.transitionTo('home');
			}

			payload = _.pick(self.password, ['origin_owner', 'origin_password', 'id', 'parent']);
			console.log("%j", payload)
			PasswordService.update(payload)
			.then(function(){
				$state.transitionTo('home');
			})
			.catch(function(err){
				console.error("%j", err);
			});


		}

		function display(){
			if( self.passwordDecrypted ){
				self.password.password = self.passwordClone.password;
			}else{
				EncryptionService.decrypt(self.password)
				.then(function(decrypted){
					self.password.password = decrypted;
				});	
			}
			self.passwordDecrypted = !self.passwordDecrypted;
			// Decrypt the password
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
				self.decryptEnabled = false;
			});
		}

	};
})();