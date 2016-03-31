(function(){
	angular
	.module('ghost')
	.controller('InviteAcceptController', InviteAcceptController);

	function InviteAcceptController($q, $stateParams, $state, $http, $mdDialog, EncryptionService){
		var self = this;

		// Config
		self.config = {
			text:{
				title: 'Welcome to Helios! Please create your user...',
				submit: 'Create',
				password: 'Password',
				repeatPssword: 'Repeat Password'
			},
			edit: false,
			add: true
		}
		
		// Literals
		self.user 				= {};
		self.new 				= {};
		self.enabled 			= true;

		// Exposed Interface
		self.submit = submit;

		// Methods
		function submit(){

			var payload = {};
			payload.username = self.user.username;
			payload.password = self.user.password;

			self.enabled = false;

			$q.all([EncryptionService.generateKeyPair(), EncryptionService.createEncryptionKey(self.encryption.decryptionPassword)])
			.then(function(values){
				payload.pk_salt = values[1].pk_salt;

				return EncryptionService.encryptPrivateKey(values[0], values[1].encryptionKey);
			})
			.then(function(encr){
				_.extend(payload, encr);

				$http({
					method: 'POST',
					url: '/api/invites/'+$stateParams.inviteLink+'/accept',
					data: payload
				})
				.then(function(res){
					self.enabled = true;
					$state.transitionTo('home');
				})
				.catch(function(err){
					self.enabled = true;

					$mdDialog.show(
						$mdDialog.alert()
						.parent(angular.element(document.querySelector('#popupContainer')))
						.clickOutsideToClose(true)
						.title('Error')
						.textContent(err.data.message)
						.ariaLabel('Alert Dialog')
						.ok('OK')
					);

					console.error(err);
				})
			})
		
			

		}



	};
})();