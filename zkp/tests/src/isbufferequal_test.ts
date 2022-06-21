import fs from "fs";
import { hasUncaughtExceptionCaptureCallback } from "process";
import * as snarkjs from "snarkjs";

const app = "isbufferequal_test";
const subdir = app + ".out/";
const wasm_file = subdir + app + "_js/" + app + ".wasm";
const proving_key_file = subdir + app + "_0001.zkey";
const verification_key_file = subdir + "verification_key.json";

//
// the following files must be already present before running run()
// - .wasm file (compiled from .circuit file
// - .zkey file (proving key)
// - verification_key.json file (verification key)
//
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


function normalizeString(s: string): number[] {
  const max_length = 64;
  const enc = new TextEncoder();

  if (s.length > max_length)
    throw new Error("Exceeding max string length")

  s = s.padEnd(max_length, " ")
  return Array.from(enc.encode(s));
}

async function run() {
  //
  // running on client side:
  //   take user's input and generate the proof
  //

  let s1 = "this is a test for a long long string!";
  let s2 = "this is a test for a long long string!";
  let inputs = {buffer1: normalizeString(s1), buffer2: normalizeString(s2)};
  // TODO: compress Array<number> into array of fields to save space

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    wasm_file,
    proving_key_file
  );

  console.log("Proof: ");
  console.log(JSON.stringify(proof, null, 1));
  console.log("\nOutput: ");
  console.log(JSON.stringify(publicSignals, null, 1));

  // **************************************************************
  // send the proof and output (public signals) to the service side
  // **************************************************************

  //
  // running on service side:
  //   verify the proof and output
  //
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
