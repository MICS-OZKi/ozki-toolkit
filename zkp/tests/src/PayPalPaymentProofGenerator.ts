import { hasUncaughtExceptionCaptureCallback } from "process";
import * as snarkjs from "snarkjs";
import { assert } from "chai";
import { buildEddsa } from "circomlibjs";
import { buildBabyjub } from "circomlibjs";
import * as ZkUtils from "./ZkUtils.js";

//
// the following files must be already present before running generateProof
// - .wasm file (compiled from .circuit file)
// - .zkey file (proving key)
//

const app = "is_subscription_good_test";
const subdir = app + ".out/";
const wasmFile = subdir + app + "_js/" + app + ".wasm";
const provingKeyFile = subdir + app + "_0001.zkey";

//
// the following files must be already present before running run()
// - .wasm file (compiled from .circuit file
// - .zkey file (proving key)
// - verification_key.json fipublile (verification key)
//
const eddsa = await buildEddsa();
const babyJub = await buildBabyjub();

export async function generateProof(
  pSignature: Uint8Array,
  subsId: string,
  paymentAge: number,
  tmstamp: number
  ) :
  Promise<[any, any]>
{
  //
  // running on oracle side:
  //   get the PII and sign the data
  //

  // oracle's signature keys
  //const prvKey = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");
  //const pubKey = eddsa.prv2pub(prvKey);
  // the proof function knows the pubkey of oracle

  //
  // running on client side:
  //   take user's input and generate the proof
  //
  // call the prove function
  //console.log("subsId=%s, paymentAge=%d\n", subsId, paymentAge);
  //let msg = ZkUtils.normalizeInputForHash(subsId, paymentAge, tmstamp);
  //const msgBits = ZkUtils.buffer2bits(msg);
  const r8Bits = ZkUtils.buffer2bits(pSignature.slice(0, 32));
  const sBits = ZkUtils.buffer2bits(pSignature.slice(32, 64));
  //const pPubKey = babyJub.packPoint(pubKey);
  //const aBits = ZkUtils.buffer2bits(pPubKey);
  //let input = {sigR8: r8Bits, sigS: sBits, payment_subs_id: normSubsId, payment_age: paymentAge, tmstamp: tmstamp};
  let input = {
    sigR8: r8Bits, sigS: sBits,                       // signature
    payment_subs_id: ZkUtils.stringToBytes(subsId),   // payment plan id
    pa: ZkUtils.numberToBytes(paymentAge, 4),         // payment age (4 bytes)
    ts: ZkUtils.numberToBytes(tmstamp, 4)             // timestamp (4 bytes)
  };

  const {proof, publicSignals} = await snarkjs.groth16.fullProve(
    input,
    wasmFile,
    provingKeyFile
  );

  return [proof, publicSignals];
}
