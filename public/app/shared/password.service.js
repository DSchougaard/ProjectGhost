(function(){

	angular
		.module('ghost')
		.service('PasswordService', PasswordService);


	function PasswordService($rootScope, $q, $state, $http, $auth, $mdDialog, $mdToast, UserService, EncryptionService, AuthService){
		// I hate JS's version of "this"
		var self 				= this;

		// Content for storing the actual passwords
		self.shownPasswords 	= [];
		self.passwords 			= [];
		self.sharedPasswords	= [];

		// Exposed Interface
		self.fetch  			= fetch;
		self.update 			= update;
		self.sharePassword 		= sharePassword;
		self.unsharePassword 	= unsharePassword;

		// --- Individual Password Controls
		self.create 			= create;
		self.del 				= del;
		self.show  				= show;
		self.hide  				= hide;



		function show(password){

			var request = undefined;
			if( password.origin_owner ){
				request = $http({
					method: 'GET',
					url: '/api/users/'+$auth.getPayload().uid+'/passwords/shared/'+password.id
				});
			}else{
				request = $http({
					method: 'GET',
					url: '/api/users/'+$auth.getPayload().uid+'/passwords/'+password.id
				});
			}

			return request
			.then(function(res){
				return EncryptionService._decrypt(res.data.password);
			})
			.then(function(decryptedPassword){
				return password.decryptedPassword = decryptedPassword;
			});
		}

		function hide(password){
			password.decryptedPassword = undefined;
		};

		function fetch(){
			$http({
				method: 'GET',
				url: '/api/users/' + $auth.getPayload().uid + '/passwords'
			})
			.then(function(res){
				self.passwords = _.clone(res.data);
				$rootScope.$broadcast('passwords', 'fetched');

				console.dir(res.data)

				return $http({
					method:'GET',
					url: '/api/users/' + $auth.getPayload().uid +'/passwords/shares'
				});
			})
			.then(function(res){

				self.sharedPasswords = _.map(res.data, function(pwrd){ 
				console.dir(res.data)

					if( pwrd.parent === null ){
						pwrd.parent = -1;
						return pwrd;
					}

					return pwrd;
				});

				self.passwords = self.passwords.concat(self.sharedPasswords);

				$rootScope.$broadcast('passwords', 'fetched');				
			})
			.catch(function(err){

				if( err.status === 401 ){
					// Auth token was invalid. Redirect to login page again.
					AuthService.logout();	
					return;
				}

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


		function del(password){
			var confirm = $mdDialog.confirm()
			.title('Are you sure you wish to delete the password?')
			.textContent('Accepting this will irrevocably delete the password, with title \"'+ password.title +'\". This process can\'t be undone.')
			.ariaLabel('Confirm delete')
			.ok('Delete Password!')
			.cancel('Do not delete password');
			$mdDialog.show(confirm).then(function(){
				// User chose to delete Password
				return $http({
					method: 'DELETE',
					url: '/api/users/' + $auth.getPayload().uid + '/passwords/' + password.id
				})
				.then(function(res){
					self.fetch();
				})
				.catch(function(err){
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
			var url = undefined;
			var filter = [];
			if(password.origin_owner){
				url = '/api/users/' + $auth.getPayload().uid + '/passwords/shares/' + password.id
				filter = ['parent', 'password'];
			}else{
				url = '/api/users/' + $auth.getPayload().uid + '/passwords/' + password.id
				filter = ['title', 'username', 'password', 'url', 'note', 'parent'];
			}

			var payload = {
				method: 'PUT',
				url: url,
				data: _.pick(password, filter)
			}

			if( password.password ){
				
				return EncryptionService.getPublicKey()
				.then(function(publicKey){
					return EncryptionService.encryptPassword(password.password, publicKey);
				})
				.then(function(encryptedPassword){
					payload.data.password = encryptedPassword;
					return $http(payload);
				});

			}else{
				return $http(payload);
			}
			
		}



		function sharePassword(password, users){

			return EncryptionService._decrypt(password.password)
			.then(function(decryptedPassword){

				var httpRequests = [];
				// Queue up all http requests to share
				for( var i = 0 ; i < users.length ; i++ ){
					var encr = EncryptionService.encryptPassword(decryptedPassword, users[i].publickey);
					httpRequests.push(
						$http({
							method: 'POST',
							url: '/api/users/'+$auth.getPayload().uid+'/passwords/'+password.id+'/shares',
							data: { owner: users[i].id, password: encr }
						})
					);
				}

				// Execute the Requests
				return $q.allSettled(httpRequests)
				.then(function(responses){

					var results = [];

					/*
						{
							shared: [User2, User1]
							failed:[
								{User1, cause}
							]
						}
					*/
					for( var i = 0 ; i < responses.length ; i++ ){

						if( responses[i].state === 'rejected' ){
							if( responses[i].reason.data.message === 'Validation error'){
								for( var j = 0 ; j < responses[j].reason.data.errors.length ; j++ ){
									$mdToast.show($mdToast.simple()
										.textContent('Validation error! '+ responses[i].reason.data.errors[j].field + ' ' + responses[i].reason.data.errors[j].error )
										.position("top right")
										.hideDelay(3000)
									);
								}
							}else{
								$mdToast.show(
									$mdToast.simple()
										.textContent('Error sharing with user ' + users[i].username + ': ' + responses[i].reason.data.message )
										.position("top right")
										.hideDelay(3000)
								);
		
							}

						}
					}

					return;
				});

			});
		};

		function unsharePassword(password, users){
			var httpRequests = [];

			for( var i = 0 ; i < users.length ; i++ ){
				httpRequests.push($http({
					method: 'DELETE',
					url: '/api/users/'+$auth.getPayload().uid+'/passwords/shares/'+users[i].shared_password
				}));
			}

			return $q.allSettled(httpRequests)
			.then(function(responses){
				for( var j = 0 ; j < responses.length ; j++ ){
					if( responses[j].state === 'rejected' ){

						console.error("%j", responses[j].reason);
						
						$mdToast.show(
							$mdToast.simple()
								.textContent('Error! ' + responses[j].reason.data.message )
								.position("top right")
								.hideDelay(3000)
						);
					}
					return;
				}
			});
		};


		function create(password){};

	};
})();