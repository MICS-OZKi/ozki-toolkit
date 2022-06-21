dependencies
============
to install dependencies:
- there are 2 dependencies: circom and snarkjs
- to install circom and snarkjs
  - follow this iden3 instructions: https://docs.circom.io/getting-started/installation/

test cases
==========
- located at <root>/zkp/tests
- each test case has 2 parts: 
  - <root>/zkp/tests/<test-case>.circom 
  - <root>/zkp/tests/src/<test-case>.js.

- the circom test cases
  - to build the circom test cases: 
    - cd <root>/zkp/tests
    - npm run setup        (one time only)
      this will create <test-case>.output dirs where each output dir contains:
       - the compiled wasm
       - proof key
       - verfication key

- the js test cases
  - currently they are js scripts
  - placed under ./src/
  - must build the circom test cases before running the js
  - to run it:
    - cd <root>/zkp/tests 
    - npm run build
    - npm run <test-case>
    - <test-case> : eddsa_test, babypbk_test, multiplier2_test, poseidon_test, strcmp_test

