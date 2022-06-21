import fs from "fs";
import { hasUncaughtExceptionCaptureCallback } from "process";
import * as snarkjs from "snarkjs";
import { assert } from "chai";
import { buildEddsa } from "circomlibjs";
import { buildBabyjub } from "circomlibjs";
import * as ZkUtils from "./ZkUtils.js";
import { time } from "console";

const app = "is_subscription_good_test";
const subdir = app + ".out/";
const wasm_file = subdir + app + "_js/" + app + ".wasm";
const proving_key_file = subdir + app + "_0001.zkey";
const verification_key_file = subdir + "verification_key.json";

//
// the following files must be already present before running run()
// - .wasm file (compiled from .circuit file
// - .zkey file (proving key)
// - verification_key.json fipublile (verification key)
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

async function run() {
  //
  // running on oracle side:
  //   get the PII and sign the data
  //
  let eddsa = await buildEddsa();
  let babyJub = await buildBabyjub();

  // oracle's signature keys
  const prvKey = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");
  const pubKey = eddsa.prv2pub(prvKey);

  // the PII + timestamp
  let subsId = "P-45T1700819560815MMKHKA6Y";
  let paymentAge = 10;
  let tmstamp = Math.floor((new Date()).getTime() / 1000);
  //let tmstamp = 255;

  // calculate the hash of the PII
  let msg = ZkUtils.normalizeInputForHash(subsId, paymentAge, tmstamp);
  console.log("**** msg: length=%d\n", msg.length); // 
  const pPubKey = babyJub.packPoint(pubKey);
  const signature = eddsa.signPedersen(prvKey, msg);
  const pSignature = eddsa.packSignature(signature); // this is the signature
  // assert (optional)
  const uSignature = eddsa.unpackSignature(pSignature);
  assert(eddsa.verifyPedersen(msg, uSignature, pubKey));

  // ***************************************************************************
  // oracle sends to client:
  // - pSignature 
  // - subsId
  // - paymentAge
  // - timestamp
  //
  // client knows the pubkey of oracle
  // ***************************************************************************

  //
  // running on client side:
  //   take user's input and generate the proof
  //
  // call the prove function
  msg = ZkUtils.normalizeInputForHash(subsId, paymentAge, tmstamp);
  //const msgBits = buffer2bits(msg);
  // split pSignature into r8Bits and sBits
  const r8Bits = buffer2bits(pSignature.slice(0, 32)); 
  const sBits = buffer2bits(pSignature.slice(32, 64));
  //const aBits = buffer2bits(pPubKey);

  let input = {
    sigR8: r8Bits, sigS: sBits,                       // signature
    payment_subs_id: ZkUtils.stringToBytes(subsId), // payment plan id
    pa: ZkUtils.numberToBytes(paymentAge, 4),         // payment age (4 bytes)
    ts: ZkUtils.numberToBytes(tmstamp, 4)             // timestamp (4 bytes)
  };
  // TODO: compress Array<number> into array of fields to save space
  const {proof, publicSignals} = await snarkjs.groth16.fullProve(
    input,
    wasm_file,
    proving_key_file
  );

  console.log("Proof: ");
  console.log(JSON.stringify(proof, null, 1));
  console.log("Output: ");
  console.log(JSON.stringify(publicSignals, null, 1));

  // ***************************************************************************
  // client sends to the server:
  // - proof 
  // - output (public signals)
  // ***************************************************************************

  //
  // running on service side:
  //

  //   verify the proof and output
  const verificationKey = JSON.parse(fs.readFileSync(verification_key_file).toString());
  const res = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
  if (res === true) {
    console.log("\nVerification succeeded");
    const [paymentStatus, timeStamp] = publicSignals;
    console.log("Output: paymentStatus=%s, timeStamp=%s", paymentStatus, timeStamp);
	  let ts = Number.parseInt(timeStamp);
	  let now = Math.floor((new Date()).getTime() / 1000);
	  console.log("Timestamp delta is %d secs", now - ts);
  }
  else {
    console.log("\nVerification failed");
  }
}

run().then(() => {
  process.exit(0);
});
