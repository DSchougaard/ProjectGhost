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
			var t = "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";
			var t2 = forge.util.decode64(t);

			
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
					if( self.encryption.decryptionPassword !== '' ){
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