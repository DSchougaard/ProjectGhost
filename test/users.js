process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
global.__base 		= __dirname + '/';

var assert = require('assert');
var request = require('supertest');  
var should = require('should');


var fs = require('fs');
var fse = require('fs-extra');
var rsa = require('node-rsa');

var crypto = require('crypto');
var encrypt = require(__base + '../helpers/encrypt.js');

//var app = require("../app").getServer;

//var agent = request.agent(server);
var server = request.agent("https://localhost:8080");



// Test user
var testUser = {
	username: 				'User3',
	password: 				'password',
	privateKey: 			fs.readFileSync('test/unittest-test.key').toString('utf8'),
	publicKey: 				fs.readFileSync('test/unittest-test.crt').toString('utf8'),
	base64 : {
		publickey: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tXG5NSUlGblRDQ0E0V2dBd0lCQWdJSkFQSXl2eXVYaGZsbU1BMEdDU3FHU0liM0RRRUJDd1VBTUdVeEN6QUpCZ05WXG5CQVlUQWtSTE1Rc3dDUVlEVlFRSURBSk9RVEVUTUJFR0ExVUVCd3dLUTI5d1pXNW9ZV2RsYmpFZ01CNEdBMVVFXG5DZ3dYVTJOb2IzVm5ZV0Z5WkNCVVpXTm9ibTlzYjJkcFpYTXhFakFRQmdOVkJBTU1DV3h2WTJGc2FHOXpkREFlXG5GdzB4TmpBeE1USXhORFF6TUROYUZ3MHlOakF4TURreE5EUXpNRE5hTUdVeEN6QUpCZ05WQkFZVEFrUkxNUXN3XG5DUVlEVlFRSURBSk9RVEVUTUJFR0ExVUVCd3dLUTI5d1pXNW9ZV2RsYmpFZ01CNEdBMVVFQ2d3WFUyTm9iM1ZuXG5ZV0Z5WkNCVVpXTm9ibTlzYjJkcFpYTXhFakFRQmdOVkJBTU1DV3h2WTJGc2FHOXpkRENDQWlJd0RRWUpLb1pJXG5odmNOQVFFQkJRQURnZ0lQQURDQ0Fnb0NnZ0lCQU1RWkx6ckFwRUdYZzl6dTZiamhSK25qQVhpVHJvZE1ZVXlxXG5ERm9ZRWx4cWNSUWx6MEFleUs0S3BHNkV5cWdvNmR1OXNMbFYzdGVJbXZxRTdhcHVTclJKYlZMWlFPeVVOb1poXG5HRzJrc1J4ZU9Zd2J4TjBuRjRReG9TejBOMXQ1dXVtdGc4M0d2dVVjMHh6ZXpGeGZ6eWZwTXBySVpic1Q1UklQXG5LU3hJb3dwbElIa1M4VDlBeFJFc3FYelN1OU5aeDdtMzRIS1VHWWZ2ek5zMFpFZWI2UHIwRGJuRmZxOXpaMnhaXG54NE1SMjFvTW4rVnFmbTdCOW9RbW10bEZTaVk3QXdZVHBwYWJWWWhzREdmUk52TXpZcHAwdG0wWjYwSkJYcHFBXG5sZGdzUzROa1ZZdW9oSU1QQUV1RFoxak1YNmFIK3E2K3BReFRUNVNjMlVYNm04d24rc3hGRHM3Z2RORmQ1S3hFXG5aWkdnbzBkWVRIUkwwS2p2WU4wNHAvVjhXLzdkb0orekFId1Q4VE01OWhSNUxVbXc3cTVJR0tKSzc4MUJQZXJxXG50VTUyZUJRbU5PSW15b1VRMUZud24wOXdGcVEyVUZrbk9ZeExXT3RMVW55K3p5alJLTE5zSDZPUXJBVjMzU1FGXG5OTlUzbmZ3Tm53OXREQWVGME5JL0sxOHo4U0pmL0dKU1RRUE5wUnhIeUdINmF3cHhyRHU3cWJ0Z3RSSFg3S09vXG5hclY0QjRYYklHbDhrM29hbTRZVDNnU25PZXV5dUI2YktDUTNGQ2ZjYUdaWWZGL3ZaK3lLb0RHcHdrWjd0YlBXXG5ETlJYUDZ5VFF2OGY1SUFhL1BmcmZKdkdieWJmSS9SdEoyZi9wRmR0dXZJVE9QN1BQRmVINUFWUkJNWmc5TUx3XG5yVFJaTkJQL0FnTUJBQUdqVURCT01CMEdBMVVkRGdRV0JCVEg1M2RCdmtzM3lDQXVUZFdjWHUyMGFET2JiakFmXG5CZ05WSFNNRUdEQVdnQlRINTNkQnZrczN5Q0F1VGRXY1h1MjBhRE9iYmpBTUJnTlZIUk1FQlRBREFRSC9NQTBHXG5DU3FHU0liM0RRRUJDd1VBQTRJQ0FRQ0czYmxtMmxZb2xpQ3U1dGxPbk8rQWY2VnlkOC9RenBUTitxU2pWRVBOXG5NVXR4Y0Nnc0xaeFgrQ0hzUk95OHRiQ3J2VFFiL05QVU1vdkx3VG00c29vWXJMQVpEUHlWd1dKOGwwTVUwdTAxXG5sQnIydk5TSzFzMjA2Tm9tY2wxMStNUVRzRVFIMk5mVTJWNFFIL2Q5Y1A2Wi96YXhrTzh3M01IWVRNQkRjZDk1XG56VHJEUlNUSFAwb1hXV0U3eWJZcm9VdjFwUUpJSFpoZTAweDl6czBsclpGTlIyRHlTaXVjZHFpVXRSckoycjAyXG5LV2tlWm5vMGRaRUpTM3V6T3FnVjdJWW1mcWlQQmxvVzVHUGtaWDl2dTYxSVpJODduQkhaYStORGZQeVRpbXBKXG4zNElYckhWdlc3NVZaQXpCTlNFK1N4a0h6eERCQXFKMUFqVVRUSWIzcFdvNzliQ1dic0JDV3l1NlM3Y0M4K29lXG44YU85YkF3NEp3V0JDN2hmSllXWkx1SGhmMm5GbEZ4WVdjdExwRk9qOEtDUDIvV3NpaUhkRkpQdlcwZ0svdXVoXG55bmpJOXNXVDArbUlxaHdBSUVPNkY3Q0N6OUhtRWFXeU9zYXVkNHhIc3RjOXUwQ1JvNytDaS95VEl4cGlWVk56XG41OW1UUnZCaU5kYW42dFczS0NIbW90YzB4SmVPSURSN3lja0Z5QktwTWhYMlVRMlNVUG1JcGY5SmpiSkRIdkNYXG4xVjA1ODhwOUx4bTNLNER6eGtHLzZYK2wralhCVkhSYXIzQll6ekgwU3VieVUzb1F1K0Q4K21GY1IrYmdXL1pEXG51YUE0dmNQZDZ6TWlsOS9YdjQvcmFDQ2pGWGhaZnRHd2pBSit4YjNxb2U3ZkFMbjJ6cUFwVUNreWRsYmNvZzdtXG5GZz09XG4tLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tXG4="
	}
};


//var IV = encrypt.generateIV();
//var ciphertext = encrypt.encrypt()



describe('API /users', function(){
	describe("GET", function(){

		it("Timeout without https", function(done){
			var wrongServer = request.agent("http://localhost:8080");
			wrongServer
			.get("/api/users")
			.end(function(err,res){
				assert.equal(err, "Error: socket hang up");
				done();
			});
		});

		it("Get contents of unittest.sqlite", function(done){

			var contents = [{"username": "User1", 'publickey': testUser.base64.publickey},{"username": "User2", 'publickey': testUser.base64.publickey}];
			server
			.get('/api/users')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				(res.body).should.have.length(2);
				(res.body).should.deepEqual(contents);
				done();
			})
		});
	});
});

describe("API /user/", function(){
	describe("POST: Create a new user", function(){

		/*
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
		*/

		it('should fail when a password is not supplied', function(done){
			server
			.post('/api/user')
			.field('username', testUser.username)
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
			.expect(400)
			.end(function(err, res){
				if(err) return done(err);
				(res.body.message).should.equal('Incomplete request: Missing password');
				done();
			});
		});

		it('should fail when a username is not supplied', function(done){
			server
			.post('/api/user')
			.field('password', testUser.password)
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				(res.body.message).should.equal('Incomplete request: Missing username');
				done();
			});
		});

		it('should fail when a private key is not supplied', function(done){
			server
			.post('/api/user')
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('publickey', testUser.publicKey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				(res.body.message).should.equal('Incomplete request: Missing private key');
				done();
			});
		});

		it('should fail when a public key is not supplied', function(done){
			server
			.post('/api/user')
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.privateKey)
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				(res.body.message).should.equal('Incomplete request: Missing public key');
				done();
			});
		});

		it("Should fail at creating a user that already exists", function(done){
			server
			.post('/api/user')
			.field('username', 'User1')
			.field('password', testUser.password)
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
			.expect(400)
			.end(function(err, res){
				if(err){
					return done(err);	
				} 
				(res.body).should.equal("Username already exists.");
				return done();
			});
		});

		it("Database file has should change after insert", function(done){
			// Create finger print before insert
			var originalDB = fs.readFileSync('./unittest.sqlite');
			var originalChecksum = crypto.createHash('sha1').update(originalDB).digest('hex');


			// Insert user
			server
			.post('/api/user')
			.field('username', testUser.username)
			.field('password', testUser.password)
			.field('privatekey', testUser.privateKey)
			.field('publickey', testUser.publicKey)
			.expect(200)
			.end(function(err,res){
				if(err){
					return done(err);
				}
				(res.body).should.equal("OK");

				var newDB = fs.readFileSync('./unittest.sqlite');
				var newChecksum = crypto.createHash('sha1').update(newDB).digest('hex');

				newChecksum.should.not.equal(originalChecksum);
				return done();
			})
		});

		it("Get all users should now return one more user", function(done) {
			server
			.get('/api/users')
			.expect(200)
			.end(function(err,res){
				if(err) return done(err);
				(res.body).should.have.length(3);
				//(res.body).should.deepEqual([{'username':'User1'},{'username':'User2'},{'username':'User3'}]);
				done();
			});
		});
	})
	
	describe("DELETE: Delete a user", function(){
		it('should fail on deleting non-existant user', function(done){
			server
			.del('/api/user')
			.field('username', 'DoesNotExist')
			.expect(400)
			.end(function(err,res){
				if(err) return done(err);
				done();
			})
		})
		it('should successfully delete a user', function(done){
			server
			.del('/api/user')
			.field('username', 'User3')
			.expect(200)
			.end(function(err,res){
				if(err) return done(err);
				done();
			})
		});

		it('should return one less user', function(done){
			server
			.get('/api/users')
			.expect(200)
			.end(function(err, res){
				if(err) return done(err);
				(res.body).should.have.length(2);
				//(res.body).should.deepEqual( [{'username':'User1', 'publickey': testUser.publicKey}, {'username':'User2', 'publickey': testUser.publicKey}] );
				done();
			})
		});
	})
	
});
