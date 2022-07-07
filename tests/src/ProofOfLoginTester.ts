import { ProofOfLoginGenerator, LoginInfo } from "./ProofOfLoginGenerator.js";
import { ProofOfLoginVerifier } from "./ProofOfLoginVerifier";
import { ZkUtils, OracleData } from "ozki-lib";

function delay(milliseconds : number) {
    return new Promise(resolve => setTimeout( resolve, milliseconds));
}

class GoogleAuthOracleData extends OracleData<LoginInfo> {
  protected formatCustomInput(timeStamp: number, input: LoginInfo): number[] {
    console.log("**** GoogleAuthOracleData.formatCustomInput");
    const zkutils = new ZkUtils();
    return zkutils.normalizeAuthInputForHash(input.domain, timeStamp);
  }
}

async function main() {
  console.log("testing ProofOfLogin....");
  const zkpComponentName = "ProveGoogleAuthMain";

  //
  // oracle-side processing
  //
  // oracle's private siging key
  const signingKey = '0001020304050607080900010203040506070809000102030405060708090001';
  // get current timestamp
  let timeStamp = Math.floor((new Date()).getTime() / 1000);
  const loginInfo: LoginInfo = {
    domain: "berkeley.edu" 
  };
  const oracleData = new GoogleAuthOracleData();
  const sig = await oracleData.sign(
    '0001020304050607080900010203040506070809000102030405060708090001', // oracle's private siging key
    timeStamp,
    loginInfo
  );

  //
  // browser-side processing
  //
  let zkpComponentPath = "../proof-generator/static/";
  const generator = new ProofOfLoginGenerator(zkpComponentPath, zkpComponentName);
  const [proof, publicSignals] = await generator.generateProof(
    Uint8Array.from(sig),
    timeStamp,
    loginInfo
  );
  console.log("Proof:");
  console.log(proof);
  console.log("Output:");
  console.log(publicSignals);

  //
  // server-side processing
  //
  zkpComponentPath = "../proof-verifier/static/";
  const verifier = new ProofOfLoginVerifier(zkpComponentPath, zkpComponentName);
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