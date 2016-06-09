# Project Ghost
Implementation of system described in master thesis "Password Manger in the Private Cloud", 2016. 
Copyright, Daniel Schougaard 2016.

## About the System
Ghost is the self-hosted password manager, for the user with security concerns. The system consists of two parts: The backend and the frontend (WebUI). The backend is a RESTful API, developed in Node.js and it is secured using JSON Web Token. The frontend is a website developed primarily in Angular, using the Material Design UI framework.

The system is developed with *one* thing in mind: Privacy. At no point in time, does the backend have the ability to access the passwords stored in it. It merely recieves and sends blobs, to the user. It is then up to the frontend to decrypt it, and show it. Because of this, unfortunately the user will have to have two different passwords. One for authenticating to the server, and one for actually decrypting the passwords. If the user should choose for these two passwords to be identical, the server will have no way of telling.

## Encryption Technologies
To enable password sharing, password encryption is a process that uses two different technologies: RSA and AES-256 (CBC). All users have a RSA keypair stored on the server: A public key in plaintext and an encrypted private key. All passwords the user owns or has access to through sharing, are encrypted using the public key. For the user to access the private key to decrypt the passwords, the private key needs to be decrypted using the "Decryption Password". This only happens in the frontend, and as such Ghost has no way of ever accessing the stored passwords.


## Dependencies
Ghost is currently only tested on Unix systems, and as such the auto-install script only works on that platform. But no technologies used are limited to only one platform, and it should run (requiring manual setup for the time) on all platforms.

In order to install Ghost, npm and bower needs to be installed.

## Installing


```
sudo apt-get install gcc clang make
sudo npm install -g node-gyp
make install
```

### Running Ghost for the first time
The first time you will run Ghost, an admin account is created. The username and password for this account is admin/admin. It is highly recommended that both the admin account's username AND password is changed immediatly. 