SSL_SUBJ = "/C=DK/ST=NA/L=Copenhagen/O=Schougaard Technologies/CN=localhost"
NAME = ghost
DIR=crypto/ssl

install: cert jwt
	mkdir -p logs
	npm install
	node_modules/bower/bin/bower install
	cd public/components/forge; npm install; npm run bundle
	node_modules/gulp/bin/gulp.js
	


cert:
	mkdir -p $(DIR)
	openssl genrsa -out $(DIR)/$(NAME).key 4096
	openssl req -new -sha256 -nodes -days 3650 -key $(DIR)/$(NAME).key -out $(DIR)/$(NAME).csr -subj $(SSL_SUBJ)
	openssl x509 -req -in $(DIR)/$(NAME).csr -signkey $(DIR)/$(NAME).key -out $(DIR)/$(NAME).cert

jwt:
	mkdir -p crypto/jwt
	openssl req -x509 -sha256 -nodes -days 3650 -newkey rsa:4096 -keyout crypto/jwt/ghost-jwt.key -subj $(SSL_SUBJ) -out crypto/jwt/ghost-jwt.crt	

count:
	cloc --exclude-dir=node_modules,components,coverage,notes --by-file .

tree:
	tree . -I 'node_modules|components|typings|coverage|notes'

test:
	rm -f logs/*
	rm -f unittest.sqlite
	#node misc/createUnitTestDB.js
	NODE_ENV=test mocha test/tests

cov: 
	rm -f logs/*
	rm -f unittest.sqlite
	@NODE_ENV=test istanbul cover _mocha test/tests.js -- -R spec
	gnome-open coverage/lcov-report/index.html

patch:
	mv node_modules/argon2/index.js node_modules/argon2/index.js.old
	{ echo -n "const Promise = require('bluebird');\n"; cat node_modules/argon2/index.js.old; } >node_modules/argon2/index.js
	rm node_modules/argon2/index.js.old
	cd node_modules/argon2; npm install --save bluebird;

.PHONY: test cov count patch