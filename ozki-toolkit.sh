#!/bin/bash
tool=$(basename $0)
if [ $# != 1 ]; then
	echo "Usage: $tool <circom_file>"
	exit 1
fi

circom_file=$1
circom_file=$(basename $circom_file)	# normalize to simple relative path
app=$(basename $circom_file ".circom")
output_dir="./zkp/build/"$app".out"

verkey_file=$output_dir"/"$app".json"
provkey_file=$output_dir"/"$app".zkey"
wasm_file=$output_dir"/"$app"_js/"$app".wasm"

echo "Building "$circom_file

#
# build the circom files
#
cd zkp/build
../zkbuild.sh $circom_file
cd ../..

#
# copies wasm, proving key, verifier key files to ozki-toolkit static dir
#
rm -f ./proof-generator/static/*
rm -rf ./proof-verifier/static/*
cp $provkey_file ./proof-generator/static/
cp $wasm_file ./proof-generator/static/
cp $verkey_file ./proof-verifier/static/

#
# build the ozki-lib npm package
#


