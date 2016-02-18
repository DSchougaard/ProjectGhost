angular
.module('ghost')
.controller('addController', AddController);

function AddController($http, $auth, $state, $stateParams, EncryptionService) {
	var self = this;

	self.password = {};
	self.submit = submit;



		// UI Strings
	var add = {
		title: "Create new password"
	}
	var edit = {
		title: "Edit password"
	}
	self.title = "";

	if( $stateParams.password === undefined ){
		// We're creating a new password
		self.title = add.title;
	}else{
		// We're editing a password
		self.title = edit.title;
		self.password = $stateParams.password;
		console.log("AddController: %j", self.password);

		// Decrypt the password
		EncryptionService.decrypt(self.password)
		.then(function(decrypted){
			self.password.password = decrypted;
		});
	}
	
	function submit() {
		console.log("Creating new password, %j", self.password);
		EncryptionService.encrypt(self.password)
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