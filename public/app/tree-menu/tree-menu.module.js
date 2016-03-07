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
			var self 			= this;
			// Literals
			self.expanded 		= true;
			self.indentation 	= 15;
			self.children 		= [];

			// Exposed interface
			self.propagate 		= propagate;
			self.register 		= register;
			self.pathExpand 	= pathExpand;

			// Methods
			function propagate(ret){
				if( ret[self.select] !== undefined ){
					self.onSelect(ret[self.select]);
					self.currentSelection = ret[self.select];
				}else{
					self.onSelect(ret);
					self.currentSelection = ret.id;
				}

				for( var i = 0 ; i < self.children.length ; i++ ){
					self.children[i].currentSelection = (self.children[i].node.id === self.currentSelection);
				}
			}

			function pathExpand(){
				
			}

			function register(child){
				self.children.push(child);
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
		controller: function ($scope, $element) {
			var self = this;
			// Literals
			self.expanded = false;
			self.currentSelection = false;
			self.indentation = self.parent.indentation + 20;

			// Exposed Interface
			self.toggle = toggle;
			self.check = check;
			self.propagate = propagate;
			self.register = register;
			self.pathExpand = pathExpand;

			// Register itself with root node
			self.register(self);
			if( self.node.initial ){
				self.parent.propagate(self.node);
				self.parent.pathExpand();
			}

			// Methods
			function check(){
				console.log(self.parent);
			}

			function propagate(ret){
				self.parent.propagate(ret);
			}

			function pathExpand(){
				self.expanded = true;
				self.parent.pathExpand();
			}

			function toggle(){
				/*
					Four cases:
						The element should toggle its 
						expansion boolean in the following cases:

						1. It is not expanded and not selected.
						2. It is expanded AND selected
						3. It is NOT expanded AND selected

						In the following cases, it should not toggle:

						1. It is expanded and NOT selected
				*/

				if( !(self.expanded && !self.currentSelection) ){
					self.expanded = !self.expanded;
				}
				self.parent.propagate(self.node);
			}

			function register(child){
				self.parent.register(child);
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