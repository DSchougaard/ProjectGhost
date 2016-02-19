(function(){
	angular
	.module('ghost')
	.controller('ToolBarController', ToolBarController);

	function ToolBarController($mdSidenav){
		console.log("ToolBarControlelr initiated");

		var self = this;
		// Methods
		self.menu = menu;

		function menu(){
			console.log("Toggling sidenav");
			$mdSidenav('left').toggle();
		}
	};
})();