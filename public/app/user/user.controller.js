(function(){

	angular
		.module('ghost')
		.controller('UserController', UserController);
		
	function UserController($http) {
		var self = this;

		// Literals
		self.title = "Edit Your Profile";

		// Default Settings Object
		self.settings = {
			generateNewEncryptionKey: false
		}









		$http.get('/api/users/me')
		.then(function(res){

		}, function(err){

		});



	};

})();
