(function(){

	angular
		.module('ghost')
		.service('UserService', UserService);


	function UserService($q, $http, $auth){
		var self 		= this;

		// Literals
		var fetched 	= false;
		self.data 		= undefined;

		// Exposed Interface
		self.isAdmin 	= isAdmin;
		self.fetch 		= fetch;
		self.get 		= get;
 
		// Methods
		function isAdmin(){
			return self.data.isAdmin;
		}

		function get(){
			return fetch();
		}

		function authorize(user){	
			return $auth.login(user);
		}

		function filter(obj, str){
			return $q(obj[str]);
		}

		function fetch(){
			console.log("Fetching data");
			return $http({
				cache: true,
				method:'GET',
				url:'/api/users/me',
			})
			.then(function(res){
				console.log("Data fetched");
				self.data = _.clone(res.data);
				return $q.resolve(self.data);
			});
		}
	};

})(); 