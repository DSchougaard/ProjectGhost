SSL_SUBJ = "/C=DK/ST=NA/L=Copenhagen/O=Schougaard Technologies/CN=localhost"
NAME = ghost
DIR=crypto/ssl2

cert:
	mkdir -p $(DIR)
	openssl genrsa -out $(DIR)/$(NAME).key 4096
	openssl req -new -sha256 -nodes -days 3650 -key $(DIR)/$(NAME).key -out $(DIR)/$(NAME).csr -subj $(SSL_SUBJ)
	openssl x509 -req -in $(DIR)/$(NAME).csr -signkey $(DIR)/$(NAME).key -out $(DIR)/$(NAME).cert


cert2:
	openssl req -x509 -sha256 -nodes -days 3650 -newkey rsa:4096 -keyout $(DIR)/$(NAME).key -subj $(SSL_SUBJ) -out $(DIR)/$(NAME).crt
