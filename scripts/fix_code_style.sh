#!/bin/bash

#
# Need to install the prettier package first
#
#npm install --save-dev prettier

npx prettier --write ../src/test
npx prettier --write ../src/performance
