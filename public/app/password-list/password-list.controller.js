(function(){

	angular
		.module('ghost')
		.controller('listController', ListController);


	function ListController($rootScope, $scope, $http, $auth, $location, $state, $mdDialog, PasswordService, EncryptionService){
		var self = this;
		
		self.selectedIndex = undefined;
		self.selected = [];

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

		// Watch for change, need this for initial load
		$scope.$on('passwords', function(res){
			self.entries = PasswordService.passwords;
		});

		$rootScope.$on('category', function(event, args){
			console.log("Password List Controller: %j", args);
			self.entries = _.filter(PasswordService.passwords, function(password){
				return args.id === password.parent;
			});
			self.selectedCategory = args.title;
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
			console.log(index);
			PasswordService.del(index);
			self.selectedIndex = undefined;
		}

		function edit(index){
			$state.go('edit', {password: self.entries[index]});
		}

		// List controls
		function select(index){
			if( self.selectedIndex !== undefined && index !== self.selectedIndex ){
				// Hide previously shown password, when it looses focus.
				PasswordService.hide(self.selectedIndex);
			}

			if(index !== self.selectedIndex){
				self.selectedIndex = index;
			}else {
				self.selectedIndex = undefined;
			}
		}

		function show(index){
			PasswordService.show(index);
		}

		function hide(index){
			PasswordService.hide(index);
		}
	}
})();
