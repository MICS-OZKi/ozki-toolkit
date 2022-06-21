import fs from "fs";
import * as snarkjs from "snarkjs";
import { assert } from "chai";

import { buildPoseidon } from "circomlibjs";

const app = "poseidon_test";
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

async function run() {
  //
  // running on client side:
  //   take user's input and genreate the proof
  //
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { inputs: [3, 4, 5, 10, 23] },
    wasm_file,
    proving_key_file
  );

  console.log("Proof: ");
  console.log(JSON.stringify(proof, null, 1));
  console.log("\nOutput: ");
  console.log(JSON.stringify(publicSignals, null, 1));

  // check value of output
  let poseidon = await buildPoseidon();
  const F = poseidon.F;
  assert(
    F.eq(
      F.e(
        "13034429309846638789535561449942021891039729847501137143363028890275222221409"
      ),
      F.e(publicSignals)
    )
  );

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
