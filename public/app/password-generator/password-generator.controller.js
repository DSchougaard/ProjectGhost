(function(){

	angular
		.module('ghost')
		.controller('PasswordGeneratorController', PasswordGeneratorController);
		
	function PasswordGeneratorController(PasswordGeneratorService, $mdDialog) {
		var self = this;

		self.config = {
			length: 20,
			tables:{
				lowerCase: true,
				upperCase: true,
				digits: true,
				signs: true
			}
		}
		
		// Literals

		// Interface
		self.submit = submit;

		// Methods
		function submit(){
			var table = PasswordGeneratorService.createTable(self.config.tables);
			var password  = PasswordGeneratorService.generate(table, self.config.length);
			$mdDialog.hide(password);
		}

		function cancel(){
			$mdDialog.cancel();
		}

	};
})();
