(function(){

	angular
		.module('ghost')
		.controller('loginController', LoginController);

	function LoginController($scope, $auth, $mdDialog, $location, $state, $mdToast){
		var self = this;

		// Literals
		self.user = {};

		// Exposed Interface
		self.submit = auth;


		function auth(){
			// Perform login
			$auth.login(self.user)
			.then(function(res){
				// Change location to main page
				$state.transitionTo("home");
			})
			.catch(function(err){

				if( err.status === 403 ){
					// Two-Factor Token is Required
					var token = $mdDialog.prompt()
					.title('Please enter the verification code')
					.placeholder('Code')
					.ariaLabel('verification code')
					.ok('OK!')
					.cancel('No thanks.');


					$mdDialog.show(token)
					.then(function(result){
						self.user.twoFactorToken = result;
						return auth();
					});
				}else{
					// Make sure to wip 2FA token
					self.user.twoFactorToken = undefined;

					// Just plain old wrong credentials
					var error = err.data.message ? err.data.message : 'Unidentified error loggin in';

					$mdToast.show(
						$mdToast.simple()
						.textContent(error)
						.position("top right")
						.hideDelay(3000)
					);		
				}

			});
		}

	};
})();