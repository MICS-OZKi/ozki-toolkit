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

# run circom compiler on the .circom file
circom $circom_file --r1cs --wasm --sym --c --output $output_dir
if [ $? != "0" ]; then
    echo "circom failed"
    exit 1
fi

# perform ceremony & generate the verification key
#snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
cd $output_dir
snarkjs powersoftau new bn128 14 pot12_0000.ptau -v
echo `uuidgen` | snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v 
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
snarkjs groth16 setup "$app".r1cs pot12_final.ptau "$app"_0000.zkey
echo `uuidgen` | snarkjs zkey contribute "$app"_0000.zkey "$app"_0001.zkey --name="1st Contributor Name" -v 
snarkjs zkey export verificationkey "$app"_0001.zkey verification_key.json
mv verification_key.json $app.json
mv "$app"_0001.zkey $app.zkey
cd ..


