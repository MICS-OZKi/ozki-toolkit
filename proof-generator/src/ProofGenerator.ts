import * as snarkjs from "snarkjs";
import { ZkUtils } from "../../common/src/";

export abstract class BaseProofGenerator<Type> {
  protected zkpComponentPath: string;
  protected zkpComponentName: string;

  constructor(
    zkpComponentPath: string,
    zkpComponentName: string
  ) 
  {
    this.zkpComponentPath = zkpComponentPath;
    this.zkpComponentName = zkpComponentName;
  }

  protected abstract formatCustomInput(customInput: Type): object

  protected createProof = async (
    input: object,
    wasmFile: string,
    provingKeyFile: string
  ): Promise<[string, string]> => {
    console.log("#### >>BaseProofGenerator.generatorProof");
    // form the path for the wasm and proving key files

    try {
      const t1 = new Date().getTime();
      // create the zk-snark proof
      const {proof, publicSignals} = await snarkjs.plonk.fullProve(
        input,
        wasmFile,
        provingKeyFile
      )
      const t2 = new Date().getTime();
      console.log("#### <<BaseProofGenerator.generatorProof: elapsedTime=%d", t2-t1);
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

export default abstract class ProofGenerator<Type> extends BaseProofGenerator<Type> {
  constructor(
      zkpComponentPath: string,
      zkpComponentName: string
      ) {
      super(zkpComponentPath, zkpComponentName);
  }

  // the subclass needs to implement this method 
  // to format caller-specific input parameters
  // protected abstract formatCustomInput(customInput: Type): object

  protected formatRequiredInput(oracleSignature: Uint8Array, proofTimeStamp: number): object {
    const zkutils = new ZkUtils();
    let obj = {
      sigR8: zkutils.buffer2bits(oracleSignature.slice(0, 32)),
      sigS: zkutils.buffer2bits(oracleSignature.slice(32, 64)),
      ts: zkutils.numberToBytes(proofTimeStamp, 4) // timestamp (4 bytes)
    }
    return obj;
  }

  generateProof = async (
    oracleSignature: Uint8Array,
    proofTimeStamp: number,
    customInput: Type
  ): Promise<[string, string]> => {
    console.log("#### >>ProofGenerator.generatorProof");
    // form the path for the wasm and proving key files
    const wasmFile = `${this.zkpComponentPath}${this.zkpComponentName}.wasm`;
    const provingKeyFile = `${this.zkpComponentPath}${this.zkpComponentName}.zkey`;

    // format the incoming params for circom input signals
    let input = {
      ...this.formatRequiredInput(oracleSignature, proofTimeStamp),
      ...this.formatCustomInput(customInput) // caller-specific input
    };

    return this.createProof(input, wasmFile, provingKeyFile);
  };
}

export abstract class UnsignedProofGenerator<Type> extends BaseProofGenerator<Type> {
  constructor(
      zkpComponentPath: string,
      zkpComponentName: string
      ) {
      super(zkpComponentPath, zkpComponentName);
  }

  // the subclass needs to implement this method 
  // to format caller-specific input parameters
  // protected abstract formatCustomInput(customInput: Type): object

  protected formatRequiredInput(proofTimeStamp: number): object {
    const zkutils = new ZkUtils();
    let obj = {
      ts: zkutils.numberToBytes(proofTimeStamp, 4) // timestamp (4 bytes)
    }
    return obj;
  }

  generateProof = async (
    proofTimeStamp: number,
    customInput: Type
  ): Promise<[string, string]> => {
    console.log("#### >>UnsignedProofGenerator.generatorProof");
    // form the path for the wasm and proving key files
    const wasmFile = `${this.zkpComponentPath}${this.zkpComponentName}.wasm`;
    const provingKeyFile = `${this.zkpComponentPath}${this.zkpComponentName}.zkey`;

    // format the incoming params for circom input signals
    let input = {
      ...this.formatRequiredInput(proofTimeStamp),
      ...this.formatCustomInput(customInput) // caller-specific input
    };

    return this.createProof(input, wasmFile, provingKeyFile);
  };
}