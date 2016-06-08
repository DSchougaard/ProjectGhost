#!/bin/bash
git clone https://github.com/ranisalt/node-argon2.git node_modules/argon2
cd node_modules/argon2
git checkout bluebird
git submodule update --init
npm install
node-gyp rebuild