(function(){

	angular
		.module('ghost')
		.controller('UserController', UserController);
		
	function UserController($q, $scope, $http, $auth, $state, EncryptionService, UserService) {
		var self 				= this;
		
		// Config
		self.config = {
			text:{
				title: 'Edit Your Profile',
				submit: 'Create',
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
				
			}
		}

		function cancel(){
						
		}

		self.errors = [];

		function submit(){
			// Authenticate to verify user's password
			console.log(self.user.password)
			$http.post('/api/auth/login', {username: self.old.username, password: self.user.password })
			.then(function(res){

				var payload = {};

				// Get an idea of the tasks at hand
				if( self.old.username !== self.user.username ){
					// User requested Username change.
					payload.username = self.user.username;
				}

				if( self.new.password !== '' && self.new.passwordRepeat !== '' ){
					// We need to change the authorization password
					payload.password = self.new.password;
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

					return $http({
							method: 'PUT',
							url: '/api/users/' + $auth.getPayload().uid,
							data: payload
						});
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
			self.user 			= _.omit(res.data, 'password');
			self.old 	 		= _.clone(res.data);
		}, function(err){

		});



	};

})();

(function(){
	angular
	.module('ghost')
	.directive('equals', function(){
		return {
        require: "ngModel",
        scope: {
            otherModelValue: "=equals"
        },
        link: function(scope, element, attributes, ngModel) {
             
            ngModel.$validators.equals = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };
 
            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };

	});

})();