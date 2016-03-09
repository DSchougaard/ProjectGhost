(function(){
	angular
	.module('ghost')
	.controller('ToolBarController', ToolBarController);

	function ToolBarController($mdSidenav, $state){
		var self = this;
		self.menu = false;
		
		if( $state.is('home') ){
			self.menu = true;
		}

		// Methods
		self.toggleMenu = toggleMenu;
		self.back = back;

		function back(){
			$state.transitionTo('home');
		}
 

		function toggleMenu(){
			$mdSidenav('left').toggle();
		}
	};
})();