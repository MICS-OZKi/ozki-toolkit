import * as snarkjs from "snarkjs";
import fs from "fs";

import { buildEddsa } from "circomlibjs";
import { buildBabyjub } from "circomlibjs";

import { Scalar, utils } from "ffjavascript";
import createBlakeHash from "blake-hash";

const app = "babypbk_test";
const subdir = app + ".out/";
const wasm_file = subdir + app + "_js/" + app + ".wasm";
const proving_key_file = subdir + app + "_0001.zkey";
const verification_key_file = subdir + "verification_key.json";

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
  let eddsa = await buildEddsa();

  const rawpvk = Buffer.from(
    "0001020304050607080900010203040506070809000102030405060708090021",
    "hex"
  );
  const pvk = eddsa.pruneBuffer(
    createBlakeHash("blake512").update(rawpvk).digest().slice(0, 32)
  );
  const S = Scalar.shr(utils.leBuff2int(pvk), 3);
  const A = eddsa.prv2pub(rawpvk);
  const input = { in: S };

  let babyJub = await buildBabyjub();
  const F = babyJub.F;
  const publicKey = { Ax: F.toObject(A[0]), Ay: F.toObject(A[1]) };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
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

  //const w = await circuitPbk.calculateWitness(input, true);
  //assert(w, {Ax : F.toObject(A[0]), Ay: F.toObject(A[1])});
  //await circuitPbk.checkConstraints(w);

  /*
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

    const prvKey = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");
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
    */
}

run().then(() => {
  process.exit(0);
});
