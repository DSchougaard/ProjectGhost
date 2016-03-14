(function(){

	angular
		.module('ghost')
		.controller('UserAddController', UserAddController);
		
	function UserAddController($q, $scope, $http, $auth, $state, EncryptionService) {
		var self 				= this;

		// Config
		self.config = {
			text:{
				title: 'Create New User',
				submit: 'Create',
				password: 'Password'
			},
			edit: false,
			add: true
		}
		
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
			
		}
	};

})();