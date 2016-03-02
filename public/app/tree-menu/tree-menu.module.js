(function(){
	angular
	.module('ghost')
	.component('treeMenu', {
		bindings: {
			data: '=',
			onSelect: '=',
			select: '='
		},
		controller: function () {
			var self = this;
			// Literals
			self.expanded = true;
			self.indentation = 15;

			// Exposed interface
			self.propagate = propagate;

			// Methods
			function propagate(ret){
				if( ret[self.select] !== undefined ){
					self.onSelect(ret[self.select]);	
				}else{
					self.onSelect(ret);
				}
				
			}

		},
		template: function($element, $attrs){
			return [
				'<div layout="column" flex>',
				'<div ng-repeat="node in $ctrl.data">',
					'<tree-node parent="$ctrl" node="node"></tree-node>',
				'</div>',
				'</div>'
			].join('');
		}
	});
})();

(function(){
	angular
	.module('ghost')
	.component('treeNode', {
		bindings: {
			node: '=',
			parent: '='
		},
		controller: function () {
			var self = this;
			// Literals
			self.expanded = false;
			self.indentation = self.parent.indentation + 20;

			// Exposed Interface
			self.toggle = toggle;
			self.check = check;
			self.propagate = propagate;

			// Methods
			function check(){
				console.log(self.parent);
			}

			function propagate(ret){
				self.parent.propagate(ret);
			}

			function toggle(){
				self.expanded = !self.expanded;
				if( self.expanded ){
					self.parent.propagate(self.node);	
				}
			}

		
		},
		templateUrl: 'app/tree-menu/tree-node.template.html'
	});
})();


(function(){
	angular
	.module('ghost')
	.component('treeLeaf', {
		bindings: {
			leaf: '=',
			parent: '='
		},
		controller: function () {
			var self = this;

			// Exposed Interface
			self.get = get;

			// Methods
			function get(){
				self.parent.propagate(self.leaf);
			}



		},
		templateUrl: 'app/tree-menu/tree-leaf.template.html'
	});
})();