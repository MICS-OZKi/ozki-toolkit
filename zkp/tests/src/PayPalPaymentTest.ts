import fs from "fs";
import { hasUncaughtExceptionCaptureCallback } from "process";
import * as snarkjs from "snarkjs";
import { assert } from "chai";
import { buildEddsa } from "circomlibjs";
import { buildBabyjub } from "circomlibjs";
import * as ZkUtils from "./ZkUtils.js";
import { generateProof } from "./PayPalPaymentProofGenerator.js";
import { verifyProof } from "./PayPalPaymentProofVerifier.js";

async function main() {
  //
  // running on oracle side:
  //   get the PII and sign the data
  //
  let eddsa = await buildEddsa();
  let babyJub = await buildBabyjub();

  // oracle's signature keys
  const prvKey = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");
  const pubKey = eddsa.prv2pub(prvKey);
  //const pPubKey = babyJub.packPoint(pubKey);

  // the PII - from PayPal
  let subsId = "P-45T1700819560815MMKHKA6Y";
  let paymentAge = 365;
  // the current timestamp
  let tmstamp = Math.floor((new Date()).getTime() / 1000);

  // calculate the sig of the PII
  let msg = ZkUtils.normalizeInputForHash(subsId, paymentAge, tmstamp);
  //console.log("**** msg: length=%d\n", msg.length); // must be 33
  const signature = eddsa.signPedersen(prvKey, msg);
  const pSignature = eddsa.packSignature(signature); // this is the signature for the PII
  // assert (optional)
  const uSignature = eddsa.unpackSignature(pSignature);
  assert(eddsa.verifyPedersen(msg, uSignature, pubKey));

  // ***************************************************************************
  // oracle sends to the client/browser:
  // - pSignature  # the signature for subsId and paymentAge
  // - subsId      # subscription id associated with the payment
  // - paymentAge  # age of the payment
  // - timestamp   # timestamp of current time
  // ***************************************************************************
  
  //
  // running on client side:
  //
  let t1 = new Date().getTime();
  const [proof, publicSignals] = await generateProof(
    pSignature,
    subsId,
    paymentAge,
    tmstamp
    ); 
  let t2 = new Date().getTime();

  console.log("Proof: ");
  //console.log(JSON.stringify(proof, null, 1));
  console.log(proof);
  console.log("Output: ");
  //console.log(JSON.stringify(publicSignals, null, 1));
  console.log(publicSignals);
  console.log("Proof generation time: %d msecs", t2-t1);

  // ***************************************************************************
  // client sends to the server:
  // - proof 
  // - output (public signals)
  // ***************************************************************************

  //
  // running on service side:
  //
  const MAX_PROOF_AGE  = 30;
  t1 = new Date().getTime();
  const res = await verifyProof(proof, publicSignals, MAX_PROOF_AGE);
  t2 = new Date().getTime();
  if (res === true) {
    console.log("\nProof verification succeeded");
  }
  else {
    console.log("\nProof verification failed");
  }
  console.log("Proof verification time: %d msecs", t2-t1);
}

async function run() {
  for (var i = 0; i < 1; i++)
    await main();
}

await run();
process.exit(0);
