(function(){

	angular
		.module('ghost')
		.controller('listController', ListController);


	function ListController($scope, $http, $auth, $location, $state, $mdDialog, PasswordService, EncryptionService){
		var self = this;
		
		self.selectedIndex = undefined;

		// User Menu Entries
		self.userMenu = ['Preferences', 'Log off'];

		// List of Passwords
		self.entries = [];
		self.entries = PasswordService.passwords;
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

		// User Menu Controls
		self.selectMenu = selectMenu;



		// Test Data
		self.selection = "";
		self.treeStructure = [
			{
				title: 'Group 1',
				type: 'node',
				children: [
					{
						title: 'Other Title',
						type: 'leaf'
					},
					{
						title: 'Other Title 2',
						type: 'leaf'
					}
				]
			},
			{
				title: 'Group 2',
				type: 'node',
				children: [
					{
						title: 'Another Title',
						type: 'leaf'
					},
					{
						title: 'Another Title 2',
						type: 'leaf'
					}
				]
			},
			{
				title: 'This is interesting',
				type: 'node',
				children: [
					{
						title: 'A little more interesting',
						type: 'node',
						children:[
							{
								title: 'Hmmmmmm',
								type: 'leaf',
								selection: 'Bambus!'
							}
						]
					}
				]
			},
			{
				title: 'Node Without children and a very very very very very very very looooooong title',
				'type': 'node',
				children: []
			}
		];

		// Watch for change, need this for initial load
		$scope.$on('passwords', function(res){
			self.entries = PasswordService.passwords;
		});

		function selectMenu(index){
			switch(index){
				case 0:
					break;
				case 1:
					$auth.logout();
					$state.transitionTo("login");
					break;
				default:
					console.log('Invalid selection');
					break;
			};
		}

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
