SSL_SUBJ = "/C=DK/ST=NA/L=Copenhagen/O=Schougaard Technologies/CN=localhost"
NAME = ghost

cert:
	mkdir -p crypto/ssl
	openssl genrsa -out crypto/ssl/$(NAME)-key.pem 4096
	openssl req -new -sha256 -key crypto/ssl/$(NAME)-key.pem -out crypto/ssl/$(NAME)-csr.pem -subj $(SSL_SUBJ)
	openssl x509 -req -in crypto/ssl/$(NAME)-csr.pem -signkey crypto/ssl/$(NAME)-key.pem -out crypto/ssl/$(NAME)-cert.pem
