angular
.module('ghost')
.controller('addController', AddController);



function AddController($http, $auth, $state, EncryptionService) {
	var self = this;
	console.log("Beam me up, scotty!");
	self.password = {};
	self.message = "test!";
	self.submit = submit;


	




	function submit() {
		console.log("Creating new password, %j", self.password);
		EncryptionService.encrypt(self.password.password)
		.then(function(encrypted){

			var password = _.clone(self.password);
			password.password = encrypted;

			return $http({
				method: 'POST',
				url: '/api/users/'+ $auth.getPayload().uid+'/passwords',
				data: password
			});
		})
		.then(function(res){
			console.log("Password added!");
			$state.transitionTo('home');
		})
		.catch(function(err){
			console.log("AddControler Error: %j", err);

			// Handle validation errors
			if( err.data.error === "validation" ){

			}


		});
	
	}
}