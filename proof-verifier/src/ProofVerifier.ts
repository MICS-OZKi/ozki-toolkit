import * as snarkjs from "snarkjs";
import * as fs from "fs";
import * as path from "path";
import { ZkUtils } from "../../common/src/";
import { ProofCacheDB } from "./ProofCacheDB";
import { MAX_PROOF_AGE } from "./config";

export interface ProofRequiredOutput {
  timeStamp:        number,
  constraintStatus: boolean
}
export default class ProofVerifier<Type> {
  private zkpComponentPath: string;
  private zkpComponentName: string;

  constructor(
    zkpComponentPath: string,
    zkpComponentName: string
  ) {
    this.zkpComponentPath = zkpComponentPath;
    this.zkpComponentName = zkpComponentName;
  }

  protected parseRequiredOutput(output: Array<string>): ProofRequiredOutput {
    // the corresponding circom output signal must follow this order (name-insensitive):
    // - timeStamp
    // - constraintStatus
    const [timeStamp, constraintStatus] = output;
    let ts = Number.parseInt(timeStamp);
    let cs = Number.parseInt(constraintStatus);
    return {timeStamp: ts, constraintStatus: (cs == 1)};
  }

  protected parseCustomOutput(output: Array<string>): Type|null {
    return null;
  }

  verifyProof = async (
    proof: string,
    output: Array<string>
  ): Promise<Type|null> => {
    console.log("#### proof verification started...");
    const t1 = new Date().getTime();

    // check proof dup in DB
    const verificationKeyFilePath = `${this.zkpComponentPath}${this.zkpComponentName}.json`;
    console.log("#### checking for dup proof...");
    const result = await ProofCacheDB.getInstance().findProof(proof, output.toString());
    if (result) {
      console.log("#### dup proof found!");
      throw Error("Duplicate proof found. Possible replay attack!");
    }

    // check zk-snark verification
    console.log("#### calling plonk.verify...");
    const verificationKey = JSON.parse(
      fs.readFileSync(verificationKeyFilePath).toString()
    );
    let res;
    try {
      res = await snarkjs.plonk.verify(verificationKey, output, proof);
    }
    catch (error) {
      console.log("#### plonk.verify failed");
      console.log(error);
      throw Error("Proof verification failed");
    }
    if (!res) {
      console.log("#### plonk.verify failed");
      throw Error("The call to plonk.verify failed.");
    }

    // check proof TTL
    const requiredOutput = this.parseRequiredOutput(output);
    let now = Math.floor(new Date().getTime() / 1000);
    console.log("#### checking timestamp for proof age");
    if (now - requiredOutput.timeStamp > MAX_PROOF_AGE * 60) {
      console.log("#### proof has expired!");
      throw Error("Proof has expired!");
    } 

    // check constraint status
    if (!requiredOutput.constraintStatus) {
      console.log("#### constraint status is false!");
      throw Error("The contraint status is false!");
    }

    console.log("#### adding proof to cache db");
    await ProofCacheDB.getInstance().addProof(proof, output.toString());
    const t2 = new Date().getTime();
    console.log("#### proof verification completed in %d ms", t2-t1);
    return this.parseCustomOutput(output);
  };
}