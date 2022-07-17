import {ProofGenerator, ZkUtils} from "ozki-toolkit";

// api-facing param object
export interface AnswerInfo {
  answerNo:            number;
  answerString:        string;
}

export class ProofOfHashGenerator extends ProofGenerator<AnswerInfo> {
    constructor(
        zkpComponentPath: string,
        zkpComponentName: string
        ) {
        console.log("#### ProofOfHashGenerator.ctor");
        super(zkpComponentPath, zkpComponentName);
    }

    protected formatCustomInput(info: AnswerInfo): object {
        console.log("#### >>ProofOfHashGenerator.formatCustomInput");

        const zkutils = new ZkUtils();
        // circom-facing param object
        let input = {
            answer_no: info.answerNo,
            answer: zkutils.stringToBytes(info.answerString)
        }; 

        console.log("#### <<ProofOfHashGenerator.formatCustomInput");
        return input;
    }    
}