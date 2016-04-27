
(function(){
	angular
	.module('ghost')
	.filter('isAfter', function() {
		return function(items, dateAfter) {
			// Using ES6 filter method
			return items.filter(function(item){
				return moment(item.date).isAfter(dateAfter);
			});
		};
	});
})();


(function(){
	angular
	.module('ghost')
	.controller('AuditController', AuditController)

	function AuditController($http, $auth, moment, $mdDialog, AuditService){
		var self = this;

		// Literals
		self.audit 		= undefined;

		self.objects  	= ['All', 'Password','User', 'Category', 'Invite', 'Authentication'];
		self.hosts 		= [];
		self.date 		= {};
		self.date.min 	= undefined;
		self.date.max 	= undefined;
		self.filter 	= undefined;
		
		self.pagination = {
			limit: 15,
			page: 1,
			limitOptions: [10, 50, 100]
		}

		self.audit = AuditService.log;
		self.hosts = AuditService.hosts;
		AuditService.fetch();

		// Exposed Interface
		self.openFiltersDialog 	= openFiltersDialog;
		self.onReorder 			= onReorder;

		// Methods
		function openFiltersDialog(){
			$mdDialog.show({
				controller: 'FiltersDialogController',
				controllerAs: 'vm',
				templateUrl: '/app/filters/filters.template.html',
				parent: angular.element(document.body),
				clickOutsideToClose:false,
				fullscreen: true,
				resolve: {
					hosts: function(){
						return self.hosts;
					},
					objects: function(){
						return self.objects;
					}
				}
			})
			.then(function(answer) {
				self.filter = answer;
			});
		}


		function onReorder(order){
			var reverse = false;
			if( order.charAt(0) === '-'){
				// We should reverse the order
				reverse = true;
				// Split the neg sign from it
				order = order.substring(1);
			}

			self.audit = _.sortBy(self.audit, order);

			// If we need to reverse it for descending sort
			if( reverse ){
				self.audit = self.audit.reverse();
			}
		}
	}
})();
