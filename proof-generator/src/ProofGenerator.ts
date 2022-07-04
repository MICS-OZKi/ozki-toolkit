import * as snarkjs from "snarkjs";
import { ZkUtils } from "../../common/src/";


export default abstract class ProofGenerator<Type> {
  private zkpComponentPath: string;
  private zkpComponentName: string;

  constructor(
    zkpComponentPath: string,
    zkpComponentName: string
  ) 
  {
    this.zkpComponentPath = zkpComponentPath;
    this.zkpComponentName = zkpComponentName;
  }

  // the subclass needs to implement this method 
  // to format caller-specific input parameters
  protected abstract formatCustomInput(customInput: Type): object

  protected formatRequiredInput(signature: Uint8Array, timeStamp: number): object {
    const zkutils = new ZkUtils();
    return { 
      sigR8: zkutils.buffer2bits(signature.slice(0, 32)),
      sigS: zkutils.buffer2bits(signature.slice(32, 64)),
      ts: zkutils.numberToBytes(timeStamp, 4) // timestamp (4 bytes)
    }
  }

  generateProof = async (
    signature: Uint8Array,
    timeStamp: number,
    customInput: Type
  ): Promise<[string, string]> => {
    console.log("#### >>ProofGenerator.generatorProof");
    // form the path for the wasm and proving key files
    const wasmFile = `${this.zkpComponentPath}${this.zkpComponentName}.wasm`;
    const provingKeyFile = `${this.zkpComponentPath}${this.zkpComponentName}.zkey`;

    // format the incoming params for circom input signals
    let input = {
      ...this.formatRequiredInput(signature, timeStamp),
      ...this.formatCustomInput(customInput) // caller-specific input
    };

    try {
      const t1 = new Date().getTime();
      // create the zk-snark proof
      const {proof, publicSignals} = await snarkjs.groth16.fullProve(
        input,
        wasmFile,
        provingKeyFile
      )
      const t2 = new Date().getTime();
      console.log("#### <<ProofGenerator.generatorProof: elapsedTime=%d", t2-t1);
      return [proof, publicSignals];
    } 
    catch (error: any) {
      console.log(error);
      return ["", ""];
    }
  };

  printGenerator = () => {
    console.log("This is Generator");
  };
}
