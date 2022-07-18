#!/bin/bash

tool=$(basename $0)
if [ $# == 2 ]; then
	base_output_dir=$(dirname $2)
	circom_file=$2
	circom_file=$(basename $circom_file)	# normalize to simple relative path
fi

print_usage() {
	echo ""
	echo "OZKi toolkit"
	echo "Usage: $tool <commands> [option]"
	echo ""
	echo "Commands:"
	echo "  build <circom_file> # to build a circom file into zkp components"
	echo "  list                # to list already built zkp components"
	echo "  clear               # to clear all zkp components"
	echo ""
	exit 1
}

do_clear() {
	rm -f ./proof-generator/static/*
	rm -rf ./proof-verifier/static/*
	exit 0
}

do_list() {
	echo "## Proving key and wasm files:"
	tree -C --noreport ./proof-generator/static/
	echo ""
	echo "## Verification key files:"
	tree -C --noreport  ./proof-verifier/static/
	exit 0
}

do_build() {
	app=$(basename $circom_file ".circom")
	output_dir=$base_output_dir"/"$app".out"
	echo Creating $output_dir

	verkey_file=$output_dir"/"$app".json"
	provkey_file=$output_dir"/"$app".zkey"
	wasm_file=$output_dir"/"$app"_js/"$app".wasm"

	echo "Building "$circom_file

	#
	# build the circom files
	#
	cd $base_output_dir
	../zkbuild.sh $circom_file
	cd ../..

	#
	# copies wasm, proving key, verifier key files to ozki-toolkit static dir
	#
	#rm -f ./proof-generator/static/*
	#rm -rf ./proof-verifier/static/*
	cp $provkey_file ./proof-generator/static/
	cp $wasm_file ./proof-generator/static/
	cp $verkey_file ./proof-verifier/static/
	exit 0
}

if [ $# == 0 ]; then
	print_usage
elif [ $# == 1 ]; then
	if [ "$1" = "list" ]; then
		do_list
	elif [ "$1" = "clear" ]; then
		do_clear
	else			
		print_usage
	fi
elif [ $# == 2 ]; then
	if [ "$1" = "build" ]; then
		do_build
	else			
		print_usage
	fi
else
	print_usage
fi 
