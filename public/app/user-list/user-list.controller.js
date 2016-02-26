(function(){
	angular
	.module('ghost')
	.controller('UserListController', UserListController);

	function UserListController($http){
		var self = this;

		// Literals
		self.users = [];
		self.selected = [];

		// Exposed interface
		self.onReorder = onReorder;

		// Populate Users list
		$http({
			method:'GET',
			url: '/api/users'
		}).then(function(res){
			self.users = res.data;
			console.log("%j", self.users);
		}, function(err){
			console.log("Error!\n%j", err);
		});

		// Methods
		function onReorder(order){
			var reverse = false;
			if( order.charAt(0) === '-'){
				// We should reverse the order
				reverse = true;
				// Split the neg sign from it
				order = order.substring(1);
			}

			// Apply order
			self.users = _.sortBy(self.users, order);

			// If we need to reverse it for descending sort
			if( reverse ){
				self.users = self.users.reverse();
			}

		}





	}
})();