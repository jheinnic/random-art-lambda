#!/bin/sh
#
# Setup environment before build layer
# sudo yum update -y
# sudo yum groupinstall "Development Tools" -y
# sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel pango-devel bzip2-devel jq
#
set -e

BUILD_DIR="${1}"

LAYER_NAME=canvas-nodejs
LAYER_DESCRIPTION="AWS Lambda Layer with node-canvas and its dependencies packaged, provides a Cairo backed Mozilla Web Canvas API implementation with additional features."
LAYER_VERSION=2.10.1
LAYER_AUTHOR="Charoite Lee"

cd "${BUILD_DIR}"

# Remove packaged layer if exists
if [ -n "$(find . -name 'canvas-nodejs_v*.zip')" ]; then
    rm canvas-nodejs_v*.zip
fi

# Clean and prepare Node.js modules and dependencies
# if [ "$(ls -A lib)" ]; then
#     rm lib/*
# fi
cd nodejs

rm -rf node_modules package*.json ../package-lock.json

# export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:${BUILD_DIR}/lib:${LD_LIBRARY_PATH}"
npm init -y
npm install "canvas@${LAYER_VERSION}" --build-from-source --save
npm install fabric --save
npm install konva --save
npm install mocha --save-dev
jq --arg LAYER_NAME "$LAYER_NAME" --arg LAYER_DESCRIPTION "$LAYER_DESCRIPTION" --arg LAYER_VERSION "$LAYER_VERSION" --arg LAYER_AUTHOR "$LAYER_AUTHOR" '.name = $LAYER_NAME | .description = $LAYER_DESCRIPTION | .version = $LAYER_VERSION | .license = "MIT" | .author = $LAYER_AUTHOR | .scripts.test = "mocha"' package.json > package-tmp.json
mv -f package-tmp.json package.json

# Test if installed modules and dependencies work fine
npm test
cp package-lock.json ..

# Prepare and package layer
cd ..
find nodejs/node_modules -type f -name '*.node' 2>/dev/null | grep -v 'obj\.target' | xargs ldd | awk 'NF == 4 { system("cp " $3 " lib") }'
zip -q -r canvas-nodejs_v$LAYER_VERSION.zip . -x LICENSE README.md .git/**\* nodejs/test/**\* *.yml build-layer.sh
