#!/bin/sh

set -exuo pipefail

rm -rf dist

npm run build

publish_dir="dist/src"

cp package.json ${publish_dir}
cp README.md ${publish_dir}

cd ${publish_dir}

npm publish --access=public