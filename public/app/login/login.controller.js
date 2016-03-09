(function(){

	angular
		.module('ghost')
		.controller('loginController', LoginController);

	function LoginController($scope, $auth, $location, $state, $mdToast){
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

				var error = err.data.message ? err.data.message : 'Unidentified error loggin in';

				$mdToast.show(
					$mdToast.simple()
					.textContent(error)
					.position("top right")
					.hideDelay(3000)
				);
			});
		}

	};
})();