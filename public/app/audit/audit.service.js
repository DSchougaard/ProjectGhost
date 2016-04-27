(function(){
	angular
	.module('ghost')
	.service('AuditService', AuditService);

	function AuditService($http, $auth, $q){
		var self = this;

		// Literals
		self.log 	= [];
		self.hosts 	= ['All'];

		// Exposed Interface
		self.fetch = fetch;

		// Methods
		function fetch(){
			$http({
				method: 'GET',
				url: '/api/users/'+$auth.getPayload().uid+'/audit'
			})
			.then(function(res){
				var formatted = format(res);
				//self.log.push(formatted.audit[0])
				self.log.push.apply(self.log, 		formatted.audit);
				self.hosts.push.apply(self.hosts, 	formatted.hosts);

				console.log(self.log)
			});
		}

		function format(res){
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
			}
			
			// Convert map to list
			hosts = _.values(_hosts);
			audit = res.data;

			var ret = {hosts: hosts, audit: audit};
			//return $q.resolve(ret);
			return ret;
		}

	};

})();