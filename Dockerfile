# Base image
FROM node:5.11.0-wheezy

# Disable graphic stuff
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# Install OS Dependencies
RUN apt-get update && apt-get install -y openssl libc6 libc6-dev

# Create app directory
RUN mkdir -p /src

# Bundle App source
COPY . /src
RUN rm -rf /src/misc

# Set workdir
WORKDIR src

# Install Dependencies
COPY package.json .
COPY .bowerrc .
COPY bower.json .
COPY gulpfile.js .

RUN npm install
RUN npm run bower install
RUN npm run gulp

# Ghost Install Script
## Creating dem folders
RUN mkdir -p logs
RUN mkdir -p crypto/ssl
RUN mkdir -p crypto/jwt

## SSL Certificate
RUN openssl genrsa -out crypto/ssl/ghost.key 4096
RUN openssl req -new -sha256 -nodes -days 3650 -key crypto/ssl/ghost.key -out crypto/ssl/ghost.csr -subj "/C=DK/ST=NA/L=Copenhagen/O=Schougaard Technologies/CN=localhost"
RUN openssl x509 -req -in crypto/ssl/ghost.csr -signkey crypto/ssl/ghost.key -out crypto/ssl/ghost.cert

RUN	openssl req -x509 -sha256 -nodes -days 3650 -newkey rsa:4096 -keyout crypto/jwt/ghost-jwt.key -subj "/C=DK/ST=NA/L=Copenhagen/O=Schougaard Technologies/CN=localhost" -out crypto/jwt/ghost-jwt.crt	


EXPOSE 8080
CMD [ "node", "app.js"]