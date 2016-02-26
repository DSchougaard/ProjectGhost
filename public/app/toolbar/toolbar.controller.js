(function(){
	angular
	.module('ghost')
	.controller('ToolBarController', ToolBarController);

	function ToolBarController($mdSidenav, $state){
		console.log("ToolBarControlelr initiated");

		var self = this;
		self.menu = false;
		
		if( $state.is('home') ){
			console.log("Menu it is...");
			self.menu = true;
		}

		// Methods
		self.toggleMenu = toggleMenu;
		self.back = back;

		function back(){
			$state.transitionTo('home');
		}
 

		function toggleMenu(){
			console.log("Toggling sidenav");
			$mdSidenav('left').toggle();
		}
	};
})();