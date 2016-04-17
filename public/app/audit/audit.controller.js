
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

	function AuditController($http, $auth, moment, $mdDialog){
		var self = this;

		// Literals
		self.audit 		= undefined;

		self.objects  	= ['All', 'Password','User', 'Category', 'Invite', 'Authentication'];
		self.hosts 		= ['All'];
		self.date 		= {};
		self.date.min 	= undefined;
		self.date.max 	= undefined;
		
		// filter values
		self.date.from 	= undefined;
		self.date.to 	= undefined;
		self.objectType = undefined;
		self.host 		= undefined;

		// Fetch data
		$http({
			method: 'GET',
			url: '/api/users/'+$auth.getPayload().uid+'/audit'
		})
		.then(function(res){

			var _hosts = {};

			for( var i = 0 ; i < res.data.length ; i++ ){
				// Formatting time
				res.data[i].epoch 	= res.data[i].time;
				res.data[i].date 	= moment.unix(res.data[i].time).format('MMMM Do YYYY');
				res.data[i].time 	= moment.unix(res.data[i].time).format('HH:mm:ss');

				// Get hosts
				if( !_hosts[res.data[i].host] ){
					_hosts[res.data[i].host] = res.data[i].host; 
				};

				// Get object types
			}
			
			// Convert map to list
			self.hosts = self.hosts.concat(_.values(_hosts));
			self.audit = res.data;

		})
		.catch(function(err){
			console.err(err);
		})

		// Exposed Interface
		self.filter 		= filter;
		self.reset 			= reset;
		self.test 			= test;


		// Methods
		function test(){
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

		function filter(item){	

			if(!item)
				return false;


			return ( self.date.from 	=== undefined || moment.unix(item.epoch).isAfter(self.date.from) 									)
				&& ( self.date.to 		=== undefined || moment.unix(item.epoch).isBefore(self.date.to) 									)
				&& ( self.objectType 	=== undefined || self.objectType 	=== 'all' 	|| item.targetType.indexOf(self.objectType) > -1  	)
				&& ( self.host 			=== undefined || self.host 			=== 'all' 	|| item.host.indexOf(self.host) > -1  		);
		}

		function reset(){
			self.date.from 	= undefined;
			self.date.to 	= undefined;

			self.objectType = undefined;
			self.host 		= undefined;
		}
	}

})();

/*
					&& (item.targetType.indexOf(self.filter.object) > -1)

*/