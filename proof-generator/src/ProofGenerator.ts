import * as snarkjs from "snarkjs";
import { ZkUtils } from "../../common/src/";

const zkutils = new ZkUtils();

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

  protected abstract formatCustomInput(customInput: Type): any  

  generateProof = async (
    pSignature: Uint8Array,
    timestamp: number,
    customInput: Type
  ): Promise<[string, string]> => {
    console.log("#### base generateProof");
    const wasmFile = `${this.zkpComponentPath}${this.zkpComponentName}.wasm`;
    const provingKeyFile = `${this.zkpComponentPath}${this.zkpComponentName}.zkey`;

    console.log("#### wasmFile=%s", wasmFile);
    console.log("#### provingKeyFile=%s", provingKeyFile);

    const r8Bits = zkutils.buffer2bits(pSignature.slice(0, 32));
    const sBits = zkutils.buffer2bits(pSignature.slice(32, 64));
    let input = {
      ...this.formatCustomInput(customInput),
      sigR8: r8Bits,
      sigS: sBits, // signature
      ts: zkutils.numberToBytes(timestamp, 4), // timestamp (4 bytes)
    };

    //
    // running on client side:
    //   take user's input and genreate the proof
    //
    try {
      const t1 = new Date().getTime();
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
