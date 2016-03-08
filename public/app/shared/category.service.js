(function(){

	angular
	.module('ghost')
	.service('CategoryService', CategoryService);

	function CategoryService($http, $auth, $q){
		var self = this;

		// Literals
		self.data 		= undefined; // Raw Category data
		self.categories = undefined; // Structured Category data

		// Exposed Interface
 		self.fetch 		= fetch;
 		self.structure  = structure;
 		self.del 		= del;
 		self.edit 		= edit;
 		self.create  	= create;

		// Methods
		function structure(){
			return self.fetch()
			.then(createStructure);
		}

		function createStructure(categories){
			var map = {};
			var structure = [];

			for( var i = 0 ; i < categories.length ; i++ ){
				map[categories[i].id] = categories[i];
			}

			for( var i = 0 ; i < categories.length ; i++ ){
				// Create children list on the category
				var category = categories[i];

				// Append Values for the tree;
				category.type = 'node';

				// Create array in parent
				var parent = map[category.parent];
				if( parent !== undefined && parent !== null && category.parent !== category.id){
					// Category has a parent1
					if( parent.children === undefined ){
						parent.children = [];
					}
					parent.children.push(category);
				}else{
					// Category does not have a parent.
					structure.push(category);
				}
			}
			return $q.resolve(structure);
		}

		function fetch(){
			return $http({
				method: 'GET',
				url: '/api/users/' + $auth.getPayload().uid + '/categories'
			}).then(function(res){
				self.data = _.clone(res.data);
				return $q.resolve(_.clone(self.data));
			}, function(err){
				return $q.reject(err.message);
			});
		}

		function create(cat){
			return $http({
				method: 'POST',
				url: '/api/users/' + $auth.getPayload().uid + '/categories',
				data: cat
			});
		}

		function del(cat){
			return $http({
				method: 'DELETE',
				url: '/api/users/' + $auth.getPayload().uid + '/categories/' + cat.id
			});
		}

		function edit(cat){
			return $http({
				method: 'POST',
				url: '/api/users/' + $auth.getPayload().uid + '/categories/' + cat.id,
				data: cat
			});	
		}
	};
})(); 