(function(){
	angular
	.module('ghost')
	.service('AuthService', AuthService);


	function AuthService($state, $auth){
		var self = this;

		// Literals

		// Exposed Interface
		self.logout = logout;

		// Methods
		function logout(){
			$auth.logout();
			$state.go("login");
		}
	};
})();