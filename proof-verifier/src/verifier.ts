import * as snarkjs from "snarkjs";
import * as fs from "fs";
import * as path from "path";

import { ZkUtils } from "../../common/src/";
import { ProofCacheDB } from "./ProofCacheDB";
import { MAX_PROOF_AGE } from "./config";

class Verifier {
  verifyProof = async (
    zkpComponentPath: string,
    zkpComponentName: string,
    proof: string,
    publicSignals: string
  ): Promise<boolean> => {
    console.log("#### proof verification started...");
    const t1 = new Date().getTime();

    const verificationKeyFilePath = `${zkpComponentPath}${zkpComponentName}.json`;
    console.log("#### checking for dup proof...");
    const result = await ProofCacheDB.getInstance().findProof(proof, publicSignals);
    if (result) {
      console.log("#### dup proof found!");
      throw Error("Duplicate proof found. Possible replay attack!");
    }

    //   verify the proof and output
    const verificationKey = JSON.parse(
      fs.readFileSync(verificationKeyFilePath).toString()
    );

    console.log("#### calling groth16.verify...");
    let res;
    try {
      res = await snarkjs.groth16.verify(
      verificationKey,
      publicSignals,
      proof
      );
    }
    catch (error) {
      console.log("#### groth16.verify failed");
      console.log(error);
      throw Error("Proof verification failed");
    }

    if (res) {
      // fail the proof if it's older than maxProoAge
      const [paymentStatus, timeStamp] = publicSignals;
      let ts = Number.parseInt(timeStamp);
      let now = Math.floor(new Date().getTime() / 1000);
      console.log("#### checking timestamp for proof age");
      if (now - ts > MAX_PROOF_AGE * 60) {
        console.log("#### proof has expired!");
        throw Error("Proof has expired!");
      } 
      else {
        let status = Number.parseInt(paymentStatus);
        res = status ? true : false;

        if (res) {
          console.log("#### adding proof to cache db");
          await ProofCacheDB.getInstance().addProof(proof, publicSignals);
        }
      const t2 = new Date().getTime();
      console.log("#### verification completed in %d ms", t2-t1);
      }
    }
    else {
      console.log("#### groth16.verify failed");
      throw Error("The call to groth16.verify failed.");
    }
    return res;
  };

  printVerifier = () => {
    new ZkUtils().print("This is Verifier");
  };
}

export default Verifier;
