var assert = require('assert');
//var request = require('request');
var request = require('supertest');



describe("User Methods", function() {

	//var server = request('../app.js');

	describe("GET /api/users", function(){
		it("Timeout without https", function(done){
			/*request('http://localhost:8080/api/users', function (error, response, body) {
   				console.log(error);
   				assert.notEqual('undefined', error);
   				assert.equal(false, true);
  			});*/
			/*request('https://localhost:8080')
			.get('/api/users')
			.expect(400)
			.end(function(err, res){
				if (err) return done(err)
					done()
			})*/

			request('https://localhost:8080')
			.get('/api/users')
			.expect(200)
			.end(function(err, res){
				if (err) return done(err)
					done()
			})



		});
	});

});
