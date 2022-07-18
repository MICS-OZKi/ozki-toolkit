import fs from "fs";
import { hasUncaughtExceptionCaptureCallback } from "process";
import { assert } from "chai";
import { buildEddsa } from "circomlibjs";
import { buildBabyjub } from "circomlibjs";
import { ProofOfPaymentGenerator } from "./ProofOfPaymentGenerator.js";
import { SubscriptionData } from "./ProofOfPaymentGenerator";
import { ProofOfPaymentVerifier } from "./ProofOfPaymentVerifier";
import { ZkUtils, OracleData } from "ozki-toolkit";

function delay(milliseconds : number) {
    return new Promise(resolve => setTimeout( resolve, milliseconds));
}

interface PayPalInput {subsPlanID: string, subsAge: number};
class PayPalOracleData extends OracleData<SubscriptionData> {
  protected formatCustomInput(timeStamp: number, input: PayPalInput): number[] {
    console.log("**** PayPalOracleData.formatCustomInput");
    const zkutils = new ZkUtils();
    return zkutils.normalizeInputForHash(input.subsPlanID, input.subsAge, timeStamp);
  }
}

async function main() {
  console.log("testing ProofOfPayment....");
  const zkpComponentName = "ProvePayPalSubscriptionMain";

  //
  // oracle-side processing
  //
  // oracle's private siging key
  const signingKey = '0001020304050607080900010203040506070809000102030405060708090001';
  // the PII - from PayPal
  let subsId = "P-1BF08962SE3742350MKRYCVQ";
  let paymentAge = 10;
  // the current timestamp
  let timeStamp = Math.floor((new Date()).getTime() / 1000);
  const subsData: SubscriptionData = {
    subsPlanID:           subsId,
    subsAge:              paymentAge
  };
  const oracleData = new PayPalOracleData();
  const sig = await oracleData.sign(signingKey, timeStamp, subsData);

  //
  // Browser/client-side processing
  // Note that the browser cannot access node_modules due to sandboxed env.
  // For the browser, the zkp components files will need to be hosted as static contents on the server
  //
  let zkpComponentPath = "node_modules/ozki-toolkit/dist/proof-generator/static/";
  const generator = new ProofOfPaymentGenerator(zkpComponentPath, zkpComponentName);
  const [proof, publicSignals] = await generator.generateProof(
    Uint8Array.from(sig),
    timeStamp,
    subsData
  );
  console.log("Proof:");
  console.log(proof);
  console.log("Output:");
  console.log(publicSignals);

  //
  // server-side processing
  //
  zkpComponentPath = "node_modules/ozki-toolkit/dist/proof-verifier/static/";
  const verifier = new ProofOfPaymentVerifier(zkpComponentPath, zkpComponentName);
  const output = JSON.parse(JSON.stringify(publicSignals));
  const proofOutput = [output[0], output[1]];
  //console.log("sleeping... ");
  //await delay(4*60*1000);
  console.log("starting verification... ");
  await verifier.verifyProof(proof, proofOutput);
  console.log("verification completed");
}

async function run() {
    await main();
}

run().then(() => {
  process.exit(0);
});