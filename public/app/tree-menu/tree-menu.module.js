(function(){

angular
	.module('ghost')
	.component('treeMenuasdasdas', {
		bindings: {
			structure: '='
		},
		controller: treeMenuController,
		controllerAs: 'tree'
		
	});



function treeMenuController(){
	var self = this;


	self.isOpen = isOpen();
}
})();


(function(){
	angular
	.module('ghost')
	.component('treeMenu', {
		bindings: {
			data: '='
		},
		controller: function () {
			this.expanded = true;
		},
		template: function($element, $attrs){
			return [
				'<div layout="column">',
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
			self.expanded = false;
			self.toggle = toggle;
			self.check = check;

			function check(){
				console.log(self.parent);
			}

			function toggle(){
				self.expanded = !self.expanded;
				console.log("Node " + self.node.title + " is expanded? " + self.expanded);
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
			self.get = get;

			function get(){
				console.log("%j", self.leaf);
			}
		},
		template: function($element, $attrs){
			return [
				'<md-button class="suppress-uppercase" ng-click="$ctrl.get()" ng-show="$ctrl.parent.expanded">',
					'[LEAF] {{$ctrl.leaf.title}}',
				'</md-button>',
			].join('');
		}
	});
})();

/*
node
	leaf
node
	leaf
node
	node
		node
			leaf
		leaf
	node
		leaf
		leaf
		leaf
node
	leaf

<tree-node></tree-node>
<tree-leaf></tree-leaf>


*/
