# ozki-lib

## System Requirements
1. Node.js 16.15.0
1. npm 8.5.5
1. MongoDB 5.0.7

### How to Install
1. [Node.js](https://nodejs.org/en/download/)
1. [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
1. [MongoDB](https://www.mongodb.com/docs/manual/installation/)

## Setup Proving Keys & Verification Key
After generating the `wasm file`, `proving key` and `verification key`. Those files must be included into static folder in `proof-generator` and `proof-verifier` folders in order to be used in `vkl-vizualization-labs` app. 
Copy generated `wasm file` & `proving key` to `proof-generator/static` folder. Then copy the `verification key` to `proof-generator/static` folder.

## Configurable config
There is a configurable file in `proof-verifier/src/config.ts` that can be adjusted. Here is the default:
```bash
export const DB_CONN_STRING = "mongodb://127.0.0.1:27017/";
export const DB_NAME = "ozki-lib-db";
export const DB_COLLECTION_NAME = "proofs";
export const MAX_PROOF_AGE = 60; // in minutes
```
NOTES:
1. All the db configs `DB_CONN_STRING`, `DB_NAME`, `DB_COLLECTION_NAME` & `MAX_PROOF_AGE` will be running once in the beginning. If it need adjusts, then it must reset in the mongodb configuration and re-deploy the vkl-vizualization-labs.
