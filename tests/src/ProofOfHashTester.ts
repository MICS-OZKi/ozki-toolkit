import fs from "fs";
import { exitCode, hasUncaughtExceptionCaptureCallback } from "process";
import { assert } from "chai";
import { buildEddsa } from "circomlibjs";
import { buildBabyjub } from "circomlibjs";
import { ProofOfHashGenerator, AnswerInfo} from "./ProofOfHashGenerator.js";
import { ProofOfHashVerifier, ParsedAnswerInfo } from "./ProofOfHashVerifier";

//
// Oracle is not used for this proof!
// This is an example of unsigned proof
//

async function main() {
  console.log("testing ProofOfHash....");

  const zkpComponentName = "GetAnswerHashMain";
  let timeStamp = Math.floor((new Date()).getTime() / 1000);
  let input: AnswerInfo  = {
    answerNo: 1,
    answerString: "7777" 
  };

  //
  // browser-side processing
  //
  let zkpComponentPath = "../proof-generator/static/";
  const generator = new ProofOfHashGenerator(zkpComponentPath, zkpComponentName);
  const [proof, publicSignals] = await generator.generateProof(
    timeStamp,
    input
  );
  console.log("Proof:");
  console.log(proof);
  console.log("Output:");
  console.log(publicSignals);

  //
  // server-side processing
  //
  zkpComponentPath = "../proof-verifier/static/";
  const verifier = new ProofOfHashVerifier(zkpComponentPath, zkpComponentName);
  const output = JSON.parse(JSON.stringify(publicSignals));
  //console.log("sleeping... ");
  //await delay(4*60*1000);

  console.log("starting verification... ");
  const parsedAnswerInfo = await verifier.verifyProof(proof, output);
  console.log("answer-no: %d", parsedAnswerInfo?.answerNo);
  console.log("verification completed");
}
  
async function run() {
    await main();
}

run().then(() => {
    process.exit(0);
});
