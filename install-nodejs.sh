#!/bin/bash

if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

[ -z $NODE_VERSION ] && echo set NODE_VERSION first && exit 1

[ -z $NPM_VERSION ] && echo set NPM_VERSION first && exit 1

curl -sSLO "http://npm.taobao.org/mirrors/node/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz" \
    && tar -xzf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
    && rm "node-v$NODE_VERSION-linux-x64.tar.gz"

npm config set registry http://r.cnpmjs.org
npm install -g npm@"$NPM_VERSION" \
    && npm cache clear

npm install -g node-gyp-install
NVM_NODEJS_ORG_MIRROR=http://npm.taobao.org/mirrors/node node-gyp-install

