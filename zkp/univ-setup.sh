#!/bin/bash

#
# zksnark universal setup
#

tool=$(basename $0)
if [ $# != 1 ]; then
	echo "Usage: $tool <power>"
	exit 1
fi

power=$1
ptau_dir="./ptau"
ptau_file=$ptau_dir"/ozki.ptau"

if [ -f "$ptau_file" ]; then
	echo $ptau_file already exists
	exit 0
fi

if [ ! -d "$ptau_dir" ]; then
	mkdir "$ptau_dir"
fi
# create a new ptau dir

cd $ptau_dir

snarkjs powersoftau new bn128 $power pot12_0000.ptau -v
echo `uuidgen` | snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v 
snarkjs powersoftau prepare phase2 pot12_0001.ptau ozki.ptau -v

cd ..


