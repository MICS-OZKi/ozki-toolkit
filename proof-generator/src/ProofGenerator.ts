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
  protected abstract formatCustomInput(customInput: Type): any  

  generateProof = async (
    pSignature: Uint8Array,
    timestamp: number,
    customInput: Type
  ): Promise<[string, string]> => {
    // form the path for the wasm and proving key files
    const wasmFile = `${this.zkpComponentPath}${this.zkpComponentName}.wasm`;
    const provingKeyFile = `${this.zkpComponentPath}${this.zkpComponentName}.zkey`;

    // format the incoming params for circom input signals
    const zkutils = new ZkUtils();
    const r8Bits = zkutils.buffer2bits(pSignature.slice(0, 32));
    const sBits = zkutils.buffer2bits(pSignature.slice(32, 64));
    let input = {
      ...this.formatCustomInput(customInput), // caller-specific input
      sigR8: r8Bits,  // dsa
      sigS: sBits,    // dsa
      ts: zkutils.numberToBytes(timestamp, 4), // timestamp (4 bytes)
    };

    try {
      const t1 = new Date().getTime();
      // create the zk-snark proof
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmFile,
        provingKeyFile
      )
      const t2 = new Date().getTime();
      console.log("#### proof generation took %d ms", t2-t1);

      return [proof, publicSignals];
    } catch (error: any) {
      console.log(error);
      return ["", ""];
    }
  };

  printGenerator = () => {
    console.log("This is Generator");
  };
}
