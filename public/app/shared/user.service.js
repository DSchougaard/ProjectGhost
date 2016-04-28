(function(){

	angular
		.module('ghost')
		.service('UserService', UserService);


	function UserService($q, $http, $auth, AuthService){
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
			return $http({
				cache: force,
				method:'GET',
				url:'/api/users/me',
			})
			.then(function(res){
				self.data = _.clone(res.data);
				self.username = self.data.username;
				return $q.resolve(self.data);
			})
			.catch(function(err){
				if( err.status === 401 ){
					// Auth token was invalid. Redirect to login page again.
					AuthService.logout();	
					return;
				}
			});
		}
	};

})(); 