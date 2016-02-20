(function(){
	angular
	.module('ghost')
	.component('treeMenu', {
		bindings: {
			data: '=',
			selection: '='
		},
		controller: function () {
			var self = this;
			// Literals
			self.expanded = true;
			self.indentation = 0;

			// Exposed interface
			self.propagate = propagate;

			// Methods
			function propagate(ret){
				self.selection = ret;
			}

		},
		template: function($element, $attrs){
			return [
				'<div layout="column" flex="none" layout-wrap	 ng-repeat="node in $ctrl.data">',
					'<tree-node parent="$ctrl" node="node"></tree-node>',
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
					if( self.node.selection !== undefined ){
						self.parent.propagate(self.node.selection);
					}else{
						self.parent.propagate(self.node);
					}
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
				console.log("%j", self.leaf);
				if( self.leaf.selection !== undefined ){
					// User had set a selection criteria
					self.parent.propagate(self.leaf.selection);
				}else{
					self.parent.propagate(self.leaf);
				}
			}



		},
		templateUrl: 'app/tree-menu/tree-leaf.template.html'
	});
})();