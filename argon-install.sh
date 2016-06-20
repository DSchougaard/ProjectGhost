#!/bin/bash
git clone https://github.com/ranisalt/node-argon2.git node_modules/argon2
cd node_modules/argon2
git submodule update --init
CXX=g++-5 npm install
node-gyp build