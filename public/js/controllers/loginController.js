(function(){

	angular
		.module('ghost')
		.controller('loginController', LoginController);

	function LoginController($scope, $auth, $location, $state){
		$scope.alerts = [];

		$scope.auth = function(){
			// When submitting make sure that alerts arent stacked
			$scope.alerts = [];

			// Perform login
			$auth.login($scope.user)
			.then(function(res){
				// Change location to main page
				$state.transitionTo("home");
			})
			.catch(function(err){
				if( err.status === 401 ){
					// Login credentials was wrong
					$scope.alerts.push({type: 'danger', message: 'Invalid login'});
				}
			});
		}

		$scope.closeAlert = function(index){
			$scope.alerts.splice(index, 1);
		}
	};
})();