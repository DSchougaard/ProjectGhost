(function(){
	angular
	.module('ghost')
	.controller('UserListController', UserListController);

	function UserListController($http, $q, $mdToast){
		var self = this;

		// Literals
		self.users = [];
		self.selected = [];
		self.state = 'default';


		// Exposed interface
		self.onReorder = onReorder;
		self.setState = setState;
		self.deleteUsers = deleteUsers;
		self.getUsers = getUsers;


		// Populate Users list
		self.getUsers();

		// Methods
		function getUsers(){
			$http({
				method:'GET',
				url: '/api/users'
			}).then(function(res){
				self.users = res.data;
			}, function(err){
				console.log("Error!\n%j", err);
			});
		}

		function deleteUsers(){
			var deleteCalls = [];

			var deleted = [];
			var fails = [];

			// Create array of promises
			angular.forEach(self.selected, function(user){
				deleteCalls.push(
					$http({
						method: 'DELETE',
						url: '/api/users/'+user.id
					})
				);
			});

			$q.allSettled(deleteCalls)
			.then(function(responses){
				angular.forEach(responses, function(res){

					if(res.state === 'fulfilled'){
						// Delete Call worked
						var id = _.last(res.value.config.url.split("/"));
						var user =  _.find(self.selected, function(user){
							return user.id == id;
						});

						deleted.push(user);

						$mdToast.show(
							$mdToast.simple()
								.textContent('User ' + user.username + ' was deleted.')
								.position("top right")
								.hideDelay(3000)
						);

						// Temporarirly remove the user from the list
						self.users = _.without(self.users, user);

					}else{
						$mdToast.show(
							$mdToast.simple()
								.textContent('Error: ' + res.reason.data.message )
								.position("top right")
								.hideDelay(3000)
						);
					}


				});

				// Re-update the list
				self.getUsers();
			});
		}


		function setState(state){
			self.state = state;
		}

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