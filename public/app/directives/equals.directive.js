
(function(){
	angular
	.module('ghost')
	.directive('equals', function(){
		return {
        require: "ngModel",
        scope: {
            otherModelValue: "=equals"
        },
        link: function(scope, element, attributes, ngModel) {
             
            ngModel.$validators.equals = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };
 
            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };

	});

})();