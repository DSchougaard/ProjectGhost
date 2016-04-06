(function(){

	angular
		.module('ghost')
		.service('PasswordService', PasswordService);


	function PasswordService($rootScope, $q, $http, $auth, $mdDialog, $mdToast, UserService, EncryptionService){
		// I hate JS's version of "this"
		var self = this;

		// Content for storing the actual passwords
		self.shownPasswords = [];
		self.passwords 		= [];
		self.sharedPasswords= [];

		// Exposed Interface
		self.fetch  	= fetch;
		self.update 	= update;
		self.sharePassword = sharePassword;

		// --- Category Password Controls
		self.select 	= select;

		// --- Individual Password Controls
		self.create 	= create;
		self.del 		= del;
		self.show  		= show;
		self.hide  		= hide;
		self.decrypt 	= decrypt;

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

				return $http({
					method:'GET',
					url: '/api/users/' + $auth.getPayload().uid +'/passwords/shares'
				});
			})
			.then(function(res){

				self.sharedPasswords = _.map(res.data, function(pwrd){ 

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
				console.error(err);
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

		function show(password){
			return EncryptionService.decrypt(this.passwords[password])
			.then(function(decryptedPassword){

				password.decryptedPassword = decryptedPassword;

			});
		};

		function decrypt(password){
			return EncryptionService.decrypt(password)
			.then(function(decrypted){
				password.decryptedPassword = decrypted;
				return password;
			});
		}

		function hide(password){
			password.decryptedPassword = undefined;
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
			console.log("Payload: %j", payload)
			return $http(payload);
		}



		function sharePassword(password, users){
			console.log("%j", password);

			var httpRequests = [];
			// Queue up all http requests to share
			for( var i = 0 ; i < users.length ; i++ ){
				console.log("Ùser %j", users[i])
				var encr = EncryptionService.encryptPassword(password.password, users[i].publickey);
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
									.textContent('Validation error! '+ responses[j].reason.data.errors[j].field + ' ' + responses[i].reason.data.errors[j].error )
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
		};



	};
})();