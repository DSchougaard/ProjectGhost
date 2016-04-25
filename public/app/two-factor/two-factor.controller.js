(function(){
	angular
	.module('ghost')
	.controller('TwoFactorController', TwoFactorController);

	function TwoFactorController($http, $mdDialog, $scope){
		var self = this;

		// Literals
		self.token 	= '';
		self.tokenErrors = {
			invalid: false,
			required: false,
			length: false,
		}

		// Exposed Interface
		self.submit = submit;
		self.cancel = cancel;

		// Methods
		generate();

		function submit(){
			self.tokenErrors = {
				invalid: false,
				required: false,
				length: false,
			}
			if( self.token === undefined || self.token === "" ){
				self.tokenErrors.required = true;
				return;
			}

			if( self.token.length !== 6 ){
				self.tokenErrors.length = true;
				return;
			}

			$http({
				method: 'POST',
				url: '/api/auth/totp/verify',
				data: self.token
			})
			.then(function(res){
				$mdDialog.hide(res.data);
			})
			.catch(function(err){
				console.error("%j", err);
				self.tokenErrors.invalid = true;
			})
		}

		function cancel(){
			$mdDialog.hide();
		}

		function generate(){
			$http({
				method: 'POST',
				url: '/api/auth/totp/generate'
			})
			.then(function(res){
				self.url = res.data;
			}) 
			.catch(function(e){
				$mdDialog.hide(e);
			});

		}

	}

})();