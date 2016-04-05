(function(){

	angular
		.module('ghost')
		.controller('UserEditController', UserEditController);
		
	function UserEditController($q, $scope, $http, $auth, $state, EncryptionService, UserService, $mdDialog) {
		var self 				= this;
		
		// Config
		self.config = {
			text:{
				title: 'Edit Your Profile',
				submit: 'Save',
				password: 'Current Password'
			},
			edit: true,
			add: false
		}

		// Literals
		self.title 				= "Edit Your Profile";
		self.user 				= {};
		self.new 				= {};
		self.auth 				= {};

		self.enabled 			= true;
		
		// Variables to contain update information
		self.update 			= {};
		self.update.user 		= {};
		self.update.password	= {};
		self.encryption 		= {};
		
		// Default Setting
		self.encryption.generateNewEncryptionKey = false;

		// Exposed Interface
		self.cancel  			= cancel;
		self.submit 			= submit;
		self.onChange 			= onChange;

		function onChange(){	
			if( self.auth.twoFactorEnabled ){
				$http({
					method: 'POST',
					url: '/api/auth/totp/generate'
				})
				.then(function(res){
					self.auth.url = res.data;
				})
				.catch(function(e){
					self.auth.twoFactorEnabled = false;
				});
			}
		}

		function cancel(){
			//get2FAToken();				
			$mdDialog.show({
				controller: 'TwoFactorController',
				controllerAs: 'vm',
				templateUrl: 'app/two-factor/two-factor.template.html',
				parent: angular.element(document.body),
				clickOutsideToClose:true,
				fullscreen: true
			})
			.then(function(answer) {
			}, function() {
			});

		}

		self.errors = [];

		function get2FAToken(){

			var confirm = $mdDialog.prompt()
				.title('Please enter the verification code')
				.placeholder('Code')
				.ariaLabel('verification code')
				.ok('OK!')
				.cancel('No thanks.');
			
			$mdDialog.show(confirm).then(function(result) {

				console.log("%j", result);

				$http({
					method: 'POST',
					url: '/api/auth/totp/verify',
					data: result
				})
				.then(function(res){
					console.log(res.data);
				})
				.catch(function(err){
					console.dir(err);
				})

			}, function() {
				$scope.status = 'You didn\'t name your dog.';
			});

		}

		function generateAuthPayload(){
			if( self.old.two_factor_enabled ){
				var token = $mdDialog.prompt()
				.title('Please enter the verification code')
				.placeholder('Code')
				.ariaLabel('verification code')
				.ok('OK!')
				.cancel('No thanks.');


				return $mdDialog.show(token)
				.then(function(result){
					console.log(result);
					return $q.resolve( {username: self.old.username, password: self.user.password, twoFactorToken: result });
				}, function(cancel){
					return $q.reject(cancel);
				});
			}else{
				return $q.resolve({username: self.old.username, password: self.user.password});
			}

		}

		function submit(){

			var token = $mdDialog.prompt()
			.title('Please enter two factor authentication token')
			.textContent('Bowser is a common name.')
			.placeholder('Token')
			.ariaLabel('Token')
			.ok('Okay!')
			.cancel('No thanks!');


			// Authenticate to verify user's password
			generateAuthPayload()
			.then(function(payload){
				console.log("Payload = %j", payload);
				return $http.post('/api/auth/login', payload)
			})
			.then(function(res){

				var payload = {};

				// Get an idea of the tasks at hand
				if( self.old.username !== self.user.username ){
					// User requested Username change.
					payload.username = self.user.username;
				}

				if( self.new.password !== undefined && self.new.passwordRepeat !== undefined ){
					// We need to change the authorization password
					payload.password = self.new.password;
				}

				if( self.old.two_factor_enabled && !self.user.two_factor_enabled ){
					payload.two_factor_enabled = false;
				}

				if( self.encryption.decryptionPassword !== '' ){
					// We need to create a new decryption password
				}

				if( self.encryption.generateNewEncryptionKey ){
					// We need to create new RSA keypair
				}

				$q(function(resolve, reject){
					if( self.encryption.decryptionPassword !== '' && self.encryption.decryptionPassword !== undefined  ){
						EncryptionService.changeDecryptionKey(self.encryption.decryptionPassword).then(resolve);
					}else{
						resolve(undefined);
					}
				})	
				.then(function( encr ){
					if( encr !== undefined ){
						_.extend(payload, encr);
					}
					
					if( self.user.two_factor_enabled && !self.old.two_factor_enabled){
						return 	$mdDialog.show({
									controller: 'TwoFactorController',
									controllerAs: 'vm',
									templateUrl: 'app/two-factor/two-factor.template.html',
									parent: angular.element(document.body),
									clickOutsideToClose:true,
									fullscreen: true
								});
					}else {
						return $q.resolve(false);
					}

				})
				.then(function(){

					if( _.pairs(payload).length > 0 ){
						return $http({
							method: 'PUT',
							url: '/api/users/' + $auth.getPayload().uid,
							data: payload
						});	
					}
					
				}).then(function(res){
					console.log("Success!");
					UserService.fetch(true)
					.then(function(){
						$state.transitionTo('home');
					});
				}, function(err){
					console.log("%j", err);
				})

			}, function(err){
				console.warn(err);
				console.log("Invalid password");
			})
		}

		$http.get('/api/users/me')
		.then(function(res){
			console.log("%j", res.data);
			self.user 			= _.omit(res.data, 'password');
			self.old 	 		= _.clone(res.data);

			if( self.user.two_factor_enabled ){
				// Two Factor Auth is enabled
			}







		}, function(err){

		});



	};

})();