(function(){
	angular
	.module('ghost')
	.controller('AuditController', AuditController)

	function AuditController($http, $auth){
		var self = this;

		// Literals
		self.audit 		= undefined;

		// Fetch data
		$http({
			method: 'GET',
			url: '/api/users/'+$auth.getPayload().uid+'/audit'
		})
		.then(function(res){
			self.audit = res.data;
		})
		.catch(function(err){
			console.err(err);
		})

		// Exposed Interface

		// Methods




	}

})();