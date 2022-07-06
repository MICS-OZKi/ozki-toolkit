import fs from "fs";
import { hasUncaughtExceptionCaptureCallback } from "process";
import { assert } from "chai";
import { buildEddsa } from "circomlibjs";
import { buildBabyjub } from "circomlibjs";
import { ProofOfPaymentGenerator } from "./ProofOfPaymentGenerator.js";
import { SubscriptionData } from "./ProofOfPaymentGenerator";
import { ProofOfPaymentVerifier } from "./ProofOfPaymentVerifier";
import { ZkUtils, OracleData } from "ozki-lib";

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

  let zkpComponentPath = "../proof-generator/static/";
  const zkpComponentName = "ProvePayPalSubscriptionMain";

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
  const sig = await oracleData.sign(
    '0001020304050607080900010203040506070809000102030405060708090001', // oracle's private siging key
    timeStamp,
    subsData
  );

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

  zkpComponentPath = "../proof-verifier/static/";
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
