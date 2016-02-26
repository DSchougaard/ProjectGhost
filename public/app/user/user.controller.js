(function(){

	angular
		.module('ghost')
		.controller('UserController', UserController);
		
	function UserController($q, $scope, $http, $auth, $state, EncryptionService) {
		var self 				= this;

		// Literals
		self.title 				= "Edit Your Profile";
		self.user 				= {};
		
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


		function cancel(){
						
		}

		self.errors = [];

		function submit(){
			
			$http.post('/api/auth/login', {username: self.user.username, password: self.update.password.oldPassword })
			.then(function(res){
				console.log("%j", res);

				var payload = {};

				// Get an idea of the tasks at hand
				if( self.update.user.username !== self.user.username ){
					// User requested Username change.
					payload.username = self.update.user.username;
				}

				if( self.update.password.newPassword !== '' && self.update.password.newPasswordRepeat !== '' ){
					// We need to change the authorization password
					payload.password = self.update.password.newPassword;
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
					console.log("Encryption data received: %j", encr);
					if( encr !== undefined ){
						_.extend(payload, encr);
					}

					return $http({
							method: 'PUT',
							url: '/api/users/' + $auth.getPayload().uid,
							data: payload
						});
				}).then(function(res){
					console.log("%j", res);
				}, function(err){
					console.log("%j", err);
				})



			}, function(err){
				console.log("Invalid password");
			})


		}

		$http.get('/api/users/me')
		.then(function(res){
			self.user 			= res.data;
			self.update.user 	= _.clone(res.data);
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