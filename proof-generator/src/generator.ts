import * as snarkjs from "snarkjs";

import { ZkUtils } from "../../common/src/";

const zkutils = new ZkUtils();

class Generator {
  generateProof = async (
    pSignature: Uint8Array,
    subsPlanId: string,
    subsAge: number,
    timestamp: number,
    wasmFile: string,
    provingKeyFile: string
  ): Promise<[string, string]> => {
    const r8Bits = zkutils.buffer2bits(pSignature.slice(0, 32));
    const sBits = zkutils.buffer2bits(pSignature.slice(32, 64));
    const input = {
      sigR8: r8Bits,
      sigS: sBits, // signature
      payment_subs_id: zkutils.stringToBytes(subsPlanId), // payment plan id
      pa: zkutils.numberToBytes(subsAge, 4), // payment age (4 bytes)
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
      );
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

export default Generator;
