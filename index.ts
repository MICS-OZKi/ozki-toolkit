import { Generator } from "./dist/proof-generator/src";
import { Verifier } from "./dist/proof-verifier/src";
import { ZkUtils } from "./dist/common/src";

const generator = new Generator();
const verifier = new Verifier();
const zkutils = new ZkUtils();

export { Generator, Verifier, ZkUtils, generator, verifier, zkutils };
