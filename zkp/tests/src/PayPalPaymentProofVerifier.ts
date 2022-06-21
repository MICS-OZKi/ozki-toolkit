import fs from "fs";
import * as snarkjs from "snarkjs";
import { assert } from "chai";
import * as ZkUtils from "./ZkUtils.js";

//
// the following files must be already present before running verifyProof
// - verification_key.json fipublile (verification key)
//

const app = "is_subscription_good_test";
const subdir = app + ".out/";
const verificationKeyFile = subdir + "verification_key.json";

export async function verifyProof(proof: string, publicSignals: string, maxProofAge: number) : Promise<boolean>{
  
  //   verify the proof and output
  const verificationKey = JSON.parse(fs.readFileSync(verificationKeyFile).toString());
  let res = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
  if (res === true) {
    // fail the proof if it's older than maxProoAge
    const [paymentStatus, timeStamp] = publicSignals;
    let ts = Number.parseInt(timeStamp);
    let now = Math.floor((new Date()).getTime() / 1000);
    if ((now - ts) > maxProofAge) {
      throw Error("Proof has expired!")
    }
    else {
      let status = Number.parseInt(paymentStatus);
      res = status ? true : false;
    }
  }

  return res;
}
