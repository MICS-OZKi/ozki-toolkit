import fs from "fs";
import * as snarkjs from "snarkjs";
import { assert } from "chai";

import { buildEddsa } from "circomlibjs";
import { buildBabyjub } from "circomlibjs";

const app = "eddsa_test";
const subdir = app + ".out/";
const wasm_file = subdir + app + "_js/" + app + ".wasm";
const proving_key_file = subdir + app + "_0001.zkey";
const verification_key_file = subdir + "verification_key.json";

function print(circuit: any, w: any, s: any) {
  console.log(s + ": " + w[circuit.getSignalIdx(s)]);
}

function buffer2bits(buff: any) {
  const res = [];
  for (let i = 0; i < buff.length; i++) {
    for (let j = 0; j < 8; j++) {
      if ((buff[i] >> j) & 1) {
        res.push(1n);
      } else {
        res.push(0n);
      }
    }
  }
  return res;
}

async function run() {
  let circuit;
  let eddsa;
  let babyJub;
  //let F;

  eddsa = await buildEddsa();
  babyJub = await buildBabyjub();
  //F = babyJub.F;
  //const msg = Buffer.from("00010203040506070809", "hex");
  const msg = Buffer.from("0001020304050607080900010203040506070809", "hex");
  //const prvKey = crypto.randomBytes(32);

  const prvKey = Buffer.from(
    "0001020304050607080900010203040506070809000102030405060708090001",
    "hex"
  );
  const pubKey = eddsa.prv2pub(prvKey);
  const pPubKey = babyJub.packPoint(pubKey);
  const signature = eddsa.signPedersen(prvKey, msg);
  const pSignature = eddsa.packSignature(signature);
  const uSignature = eddsa.unpackSignature(pSignature);

  assert(eddsa.verifyPedersen(msg, uSignature, pubKey));

  //const msg2 = Buffer.from("0001020304050607080900010203040506070800", "hex");
  //const msgBits = buffer2bits(msg2); // pass wrong msg
  const msgBits = buffer2bits(msg);
  const r8Bits = buffer2bits(pSignature.slice(0, 32));
  const sBits = buffer2bits(pSignature.slice(32, 64));
  const aBits = buffer2bits(pPubKey);

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { A: aBits, R8: r8Bits, S: sBits, msg: msgBits },
    wasm_file,
    proving_key_file
  );

  console.log("Proof: ");
  console.log(JSON.stringify(proof, null, 1));
  console.log("\nOutput: ");
  console.log(JSON.stringify(publicSignals, null, 1));

  const vKey = JSON.parse(fs.readFileSync(verification_key_file).toString());
  const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  if (res === true) {
    console.log("Verification OK");
  } else {
    console.log("Invalid proof");
  }
}

run().then(() => {
  process.exit(0);
});
