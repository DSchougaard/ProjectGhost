(function(){
	angular
	.module('ghost')
	.service('AuthorizationService', AuthorizationService);

	function AuthorizationService($auth){
		var self = this;
		// Exposed Interface
		self.isAuthorized = isAuthorized;

		// User Rights
		var user = [
			'self.user.edit',
			'self.user.delete',
			'self.password.list',
			'self.password.edit',
			'self.password.delete',
			'self.password.create',
		];
		// Admin Rights
		var admin = [
			'user.list',
			'user.create',
			'user.edit',
			'user.delete'
		];
		// Append User Rights to Admin
		admin = admin.concat(user);



		function isAuthorized(target){
			if( $auth.getPayload().lvl === 1 ){
				return ( _.indexOf(admin, target) !== -1 );
			}else{
				return ( _.indexOf(user, target) !== -1 );
			}
		}
	}
})();
/*
(function(){
	angular
	.module('ghost')
	.directive('restrict', restrict);

	function restrict(AuthorizationService){
		return {
			restrict: 'A',
        	priority: 100000,
        	scope: false,
        	link: function() {},
        	compile: function(element, attr, linker){

        		var target = attr.restrict;

        		var access = AuthorizationService.isAuthorized(target);

        		if( !access ){
        			element.children().remove();
        			element.remove();
        		}

        	}

		};
	}
})();*/