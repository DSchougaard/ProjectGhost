(function(){

	angular
		.module('ghost')
		.service('UserService', UserService);


	function UserService($q, $http, $auth){
		var self 		= this;

		// Literals
		var fetched 	= false;
		self.username 	= '';
		self.isAdmin 	= false;
		self.data 		= {};

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

		function fetch(force){
			console.log("Fetching data");
			return $http({
				cache: force,
				method:'GET',
				url:'/api/users/me',
			})
			.then(function(res){
				console.log("Data fetched");
				self.data = _.clone(res.data);
				self.username = self.data.username;
				return $q.resolve(self.data);
			});
		}
	};

})(); 