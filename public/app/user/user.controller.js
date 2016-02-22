(function(){

	angular
		.module('ghost')
		.controller('UserController', UserController);
		
	function UserController($http, $state) {
		var self 			= this;

		// Literals
		self.title 			= "Edit Your Profile";
		self.user 			= {};
		self.password 		= {};
		// Default Settings Object
		self.settings 		= {
			generateNewEncryptionKey: false
		}

		// Exposed Interface
		self.cancel  		= cancel;
		self.submit 		= submit;


		function cancel(){
			$state.go('home');
		}

		function submit(){
			if( self.password.oldPassword !== '' && self.password.newPassword !== '' && self.password.newPasswordRepeated ){

			}

		}

		$http.get('/api/users/me')
		.then(function(res){
			self.user.username = res.data.username;
		}, function(err){

		});



	};

})();


(function(){
	angular
	.module('ghost')
	.directive('requiredIf', function(){
		return {
			require: 'ngModel',

			link: function(scope, elm, attrs, ctrl){
			
				ctrl.$validators.requiredIf = function(modelValue, viewValue){
					console.log("%j", attrs);
					if( attrs.requiredIf !== '' ){
						return viewValue !== '';
					}

					return true;
				}
				scope.$watch('data', function(){
					ctrl.$validate();
				}, true);

			}
		}
	})
})();