(function(){
	angular
	.module('ghost')
	.controller('InviteController', InviteController);

	function InviteController($http){
		var self = this

		// Text Config
		self.config = {
			text: {
				title: "Invite New User",
				submit: 'Generate Invite Link'
			}
		}

		// Literals

		// Exposed Interface
		self.submit = generate;


		// Methods
		function generate(){
			$http({
				method:'POST',
				url: '/api/invites'
			})
			.then(function(res){
				self.link = res.data;
			})
			.catch(function(err){
				console.log(err);
			})
		}	
	};
})();