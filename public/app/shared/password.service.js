(function(){

	angular
		.module('ghost')
		.service('PasswordService', PasswordService);


	function PasswordService($rootScope, $q, $http, $auth, $mdDialog, EncryptionService){
		// I hate JS's version of "this"
		var self = this;

		// Content for storing the actual passwords
		self.shownPasswords = [];
		self.passwords 		= [];

		// Exposed Interface
		self.fetch  	= fetch;
		// --- Category Password Controls
		self.select 	= select;

		// --- Individual Password Controls
		self.create 	= create;
		self.del 		= del;
		self.show  		= show;
		self.hide  		= hide;

		function select(source, category){
			switch(source){
				case 'own':
					return select.own(category);
					break;
				case 'favorites':
					break;
				case 'shared':
					break;
			}
		}


		var select = {};
		select.own = function(category){

			if( self.cache[category.id] !== undefined ){
				self.cache[category.id] = _.filter(self.passwords, function(password){
					return password.parent === category.id;
				});
			}

			return self.cache[category.id];
		}







		function fetch(){
			$http({
				method: 'GET',
				url: '/api/users/' + $auth.getPayload().uid + '/passwords'
			})
			.then(function(res){
				self.passwords = _.clone(res.data);
				$rootScope.$broadcast('passwords', 'fetched');
			})
			.catch(function(err){
			    $mdDialog.show(
			        $mdDialog.alert()
		            .parent(angular.element(document.querySelector('#popupContainer')))
		            .clickOutsideToClose(true)
		            .title('Error retrieving passwords')
		            .textContent(err.data.message)
		            .ariaLabel('Alert retrieve')
		            .ok('OK')
		        );
			});
		}

		function show(index){
			console.log("Password Service: Showing password with ID %d, resolving to %j", index, this.passwords[index])
			return EncryptionService.decrypt(this.passwords[index])
			.then(function(password){

				self.passwords[index].decryptedPassword = password;

			});
		};

		function hide(index){
			self.passwords[index].decryptedPassword = undefined;
		};

		function create(password){};

		function del(index){
			var confirm = $mdDialog.confirm()
			.title('Are you sure you wish to delete the password?')
			.textContent('Accepting this will irrevocably delete the password, with title \"'+ self.passwords[index].title +'\". This process can\'t be undone.')
			.ariaLabel('Confirm delete')
			.ok('Delete Password!')
			.cancel('Do not delete password');
			$mdDialog.show(confirm).then(function(){
				// User chose to delete Password
				return $http({
					method: 'DELETE',
					url: '/api/users/' + $auth.getPayload().uid + '/passwords/' + self.passwords[index].id
				})
				.then(function(res){
					console.log("Deleted password");
					self.fetch();
				})
				.catch(function(err){
					console.log("Error Deleting Password");
					console.log(err);

				    $mdDialog.show(
				        $mdDialog.alert()
			            .parent(angular.element(document.querySelector('#popupContainer')))
			            .clickOutsideToClose(true)
			            .title('Error deleting password')
			            .textContent(err.data.message)
			            .ariaLabel('Alert delete')
			            .ok('OK')
		       		 );

				})
			}, function(){
				// User canceled the process
			});
		}

		function update(password){
			return $http({
				metod: 'PUT',
				url: '/api/users/' + $auth.getPayload().uid + '/passwords/' + password.id,
				data: _.omit(password, 'id')
			});
		}


	};
})();