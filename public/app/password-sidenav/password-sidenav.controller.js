(function(){
	angular
	.module('ghost')
	.controller('PasswordSideNavController', PasswordSideNavController);


	function PasswordSideNavController($state, $auth){
		var self = this;

		// Literals
		self.userMenu 		= ['Preferences', 'Log off'];

		// Exposed Interface
		self.selectMenu 	= selectMenu;

		function selectMenu(index){
			switch(index){
				case 0:
					console.log("Going to User.Edit");
					$state.go('user');
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
	};
})();


