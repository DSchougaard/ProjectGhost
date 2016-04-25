(function(){

	angular
		.module('ghost')
		.controller('EditPasswordController', EditPasswordController);
		
	function EditPasswordController($q, CategoryService, PasswordService, $http, $auth, $state, $stateParams, EncryptionService,$mdMedia, $mdDialog) {
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
		self.passwordClone 	= {};
		self.submit 		= submit;
		self.title 			= "";
		self.decryptEnabled = true;
		self.passwordDecrypted = false;

		// Lists for managing sharing
		self.users 			= [];
		self.oldSharedWith 	= [];
		self.sharedWith 	= [];
		
		// Field for the Tree-Menu to properly select the parent, when editting.
		self.selection 		= {};
		self.categories 	= [];

		// Interface
		self.treeSelect 	= treeSelect;
		self.display 		= display;
		self.querySearch 	= querySearch;
		self.generatePassword = generatePassword;

		$http({
			method: 'GET',
			url: '/api/users/'+$auth.getPayload().uid+'/passwords/'+$stateParams.password.id
		})
		.then(function(res){
			// We're editing a password
			self.password 		= res.data;
			self.passwordClone 	= _.clone(self.password);
			self.selection.id 	= self.password.parent;
		})

		$http({
			method: 'GET',
			url: '/api/users'
		})
		.then(function(res){
			self.users = res.data;

			return $http({
				method: 'GET',
				url: '/api/users/'+$auth.getPayload().uid+'/passwords/'+self.password.id+'/shares'
			});
		})
		.then(function(res){
			self.oldSharedWith 	= _.clone(res.data);
			self.sharedWith  	= res.data;
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
			console.log("Selection: %j", selection)
			self.password.parent = selection.id;
			console.log("Password: %j", self.password)
		}

		function submit(){

			var payload = {};
			var keys = _.keys(_.omit(self.password, 'password'));
			for( var i = 0 ; i < keys.length ; i++ ){
				if( self.passwordClone[keys[i]] !== self.password[keys[i]] ){
					payload[keys[i]] = self.password[keys[i]];
				}
			}
			if( self.passwordDecrypted ){
				payload.password = self.password.password;
			}

			// Determines which users should have password sharead with them, and which should
			// have a share removed
			// Intersection is the users commen between the shares from db and selected shares on submit
			var intersection 	= _.intersection(self.sharedWith, self.oldSharedWith);
			// The difference between the current selection and the intersection yields the newly added users
			var share  			= _.difference(self.sharedWith, intersection);
			// The difference between the db selection and the intersection, yields users that have been removed from sharing
			var unshare 		= _.difference(self.oldSharedWith, intersection);

			var promises = [];
			promises.push( PasswordService.update(self.password) );
			if( share.length > 0 )
				promises.push( PasswordService.sharePassword(self.password, share) );
			if( unshare.length > 0 )
				promises.push( PasswordService.unsharePassword(self.password, unshare) );

			console.log("Share: %j", share);
			console.log("Unshare: %j", unshare);

			if( !self.passwordDecrypted && share.length > 0 ){

			}


			/*EncryptionService.decrypt(self.password)
			.then(function(decrypted){
				var t = _.clone(self.password);
				t.password = decrypted;
				return 	$q.allSettled(promises)
				})*/
			$q.allSettled(promises)
			.then(function(res){
				console.log("got OK! %j", res);
				$state.transitionTo('home');
			})
			.catch(function(err){
				console.error(err);
			})
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
				console.log(password)
				self.password.password = password;
				self.decryptEnabled = false;
			});
		}

	};
})();