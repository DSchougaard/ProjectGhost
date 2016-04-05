(function(){

	angular
		.module('ghost')
		.controller('listController', ListController);


	function ListController($rootScope, $scope, $http, $auth, $location, $state, $mdDialog, PasswordService, EncryptionService){
		var self = this;
		
		// Literals
		self.selectedIndex 	= undefined;
		self.selected 		= [];
		self.searching 		= false;
		self.search 		= undefined;
		self.filter 		= undefined;
		self.cachedFilter  	= undefined;

		// User Menu Entries
		self.userMenu = ['Preferences', 'Log off'];

		// List of Passwords
		self.entries = [];
		self.selectedCategory = '';
		//self.entries = PasswordService.passwords;
		// Fetch the data
		PasswordService.fetch();

		// List Controls
		self.select = select; 

		// Methods for list items
		self.hide 	= hide;
		self.show 	= show;
		self.del 	= del;
		self.edit 	= edit;

		// UI show/hide statusses
		self.isVisible = isVisible;

		// Searching
		self.search = search;


		// Watch for change, need this for initial load
		$scope.$on('passwords', function(res){
			self.entries = PasswordService.passwords;
		});

		$rootScope.$on('category', function(event, args){
			/*self.entries = _.filter(PasswordService.passwords, function(password){
				return args.id === password.parent;
			});*/
			self.selectedCategory = args.title;
			self.filter = {parent: args.id};
		})


		// Method for determining wheter or not a field is shown	
		function isVisible(value){
				return (
				value !== '' &&
				value !== null &&
				value !== undefined
				);
		}

		function logout(){
			$auth.logout();
			$state.transitionTo("login");
		}	

		function del(index){
			PasswordService.del(index);
			self.selectedIndex = undefined;
		}

		function edit(index){
			$state.go('edit', { password: _.findWhere(self.entries, {id: index}) } );
		}

		// List controls
		function select(index){
			if( self.selectedIndex !== undefined && index !== self.selectedIndex ){
				// Hide previously shown password, when it looses focus.
				PasswordService.hide(self.selectedIndex);
			}

			if(index !== self.selectedIndex){
				self.selectedIndex = index;

				var password = _.findWhere(self.entries, {id: index});

					$http({
						method: 'GET',
						url: 'api/users/'+$auth.getPayload().uid+'/passwords/'+password.id+'/shares'
					})
					.then(function(users){
						password.shared = users.data;
					})
					.catch(function(err){
						console.error(err);
					})
			
			}else {
				self.selectedIndex = undefined;
			}
		}

		function show(index){
			var password = _.findWhere(self.entries, {id: index});
			PasswordService.decrypt(password);
		}

		function hide(index){
			var password = _.findWhere(self.entries, {id: index});
			passowrd.decryptedPassword = undefined;
		}

		function search(){
			if( !self.searching ){
				self.cachedFilter = self.filter;
				self.filter = '';
			}else{
				self.filter = self.cachedFilter;
			}
			self.searching = !self.searching;
		}

	}
})();
