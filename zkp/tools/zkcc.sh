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
