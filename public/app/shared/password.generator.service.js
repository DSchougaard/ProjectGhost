(function(){

	angular
		.module('ghost')
		.service('PasswordGeneratorService', PasswordGeneratorService);


	function PasswordGeneratorService(){
		var self = this;

		// Literals

		// Exposed Interface
		self.generate = generate;
		self.createTable = createTable;

		// Methods
		function generate(characters, length){
			
			var password = '';
			for( var i = 0 ; i < length ; i++ ){
				var byte = forge.random.getBytesSync(1);
				while( byte.charCodeAt(0) >= characters.length ){
					byte = forge.random.getBytesSync(1);					
				}
				password = password + characters[byte.charCodeAt(0)];
			} 
			return password;
		}	

		function createTable(opts){
			var lowerCase 	= ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
			var upperCase 	= ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
			var digits 		= ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
			var signs 		= ['-', '_', ',', '.', ';', ':', '#', '/', '(', ')', '=', '?', '<', '>'];


			var concat = [];
			if(opts.lowerCase){
				concat = concat.concat(lowerCase);
			}
			if(opts.upperCase){
				concat = concat.concat(upperCase);
			}
			if(opts.digits){
				concat = concat.concat(digits);
			}
			if(opts.signs){
				concat = concat.concat(signs);
			}

			return concat;
		}


	}

})();