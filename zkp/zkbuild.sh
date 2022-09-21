#!/bin/bash

tool=$(basename $0)
if [ $# != 1 ]; then
	echo "Usage: $tool <circom_file>"
	exit 1
fi

circom_file=$1
circom_file=$(basename $circom_file)	# normalize to simple relative path
app=$(basename $circom_file ".circom")
if [ $circom_file == $app ]; then
	echo "File \"$circom_file\" does not have .circom extension"
	exit 1
fi

output_dir=$app".out"

# wipe out existing output dir
if [ -d "$output_dir" ]; then
	rm -rf $output_dir
fi
# create a new output dir
mkdir $output_dir

#
# run circom compiler on the .circom file
#
echo "Compiling circom program into witness-calculating .wasm module"
circom $circom_file --r1cs --wasm --sym --c --output $output_dir
if [ $? != "0" ]; then
    echo "circom failed"
    exit 1
fi


#
# with plonk, now it's no longer necessary to perform per-app trusted setup
#
cd $output_dir
ptau_dir="../../ptau"
ptau_file=$ptau_dir"/ozki.ptau"
#
# generate the proving key
#
snarkjs plonk setup "$app".r1cs $ptau_file "$app"_0000.zkey
#echo `uuidgen` | snarkjs zkey contribute "$app"_0000.zkey "$app"_0001.zkey --name="1st Contributor Name" -v 
#
# generate the verification key
#
snarkjs zkey export verificationkey "$app"_0000.zkey "$app".json
snarkjs zkey export solidityverifier "$app"_0000.zkey "$app".sol
# copy zkey
cp "$app"_0000.zkey $app.zkey
cd ..
