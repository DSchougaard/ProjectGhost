(function(){
	angular
	.module('ghost')
	.controller('FiltersDialogController', FiltersDialogController)

	function FiltersDialogController(moment, $mdDialog, hosts, objects){
		var self 		= this;

		// Exposed Interface
		self.submit 	= submit;
		self.cancel 	= cancel;
		self.objects 	= objects;
		self.hosts 		= hosts;
		
		// Filter Valies
		self.date 		= {};
		self.date.from 	= undefined;
		self.date.to 	= undefined;
		self.objectType = undefined;
		self.host 		= undefined;

		// Methods
		function submit(){
			$mdDialog.hide(filter);
		}

		function cancel(){
			$mdDialog.cancel();
		}

		function filter(item){

			if(!item)
				return false;

			return ( self.date.from 	=== undefined || moment.unix(item.epoch).isAfter(self.date.from) 									)
				&& ( self.date.to 		=== undefined || moment.unix(item.epoch).isBefore(self.date.to) 									)
				&& ( self.objectType 	=== undefined || self.objectType 	=== 'all' 	|| item.targetType.indexOf(self.objectType) > -1  	)
				&& ( self.host 			=== undefined || self.host 			=== 'all' 	|| item.host.indexOf(self.host) > -1  		);
		}

	};

})();