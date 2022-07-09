import {ProofGenerator, ZkUtils} from "ozki-toolkit";

export interface SubscriptionData {
  subsPlanID:           string;
  subsAge:              number;
}

interface InputPayPalObject {
    payment_subs_id:    number[]; // payment plan id
    pa:                 number[];
}

export class ProofOfPaymentGenerator extends ProofGenerator<SubscriptionData> {
    constructor(
        zkpComponentPath: string,
        zkpComponentName: string
        ) {
        console.log("#### ProofOfPaymentGenerator.ctor");
        super(zkpComponentPath, zkpComponentName);
    }

    protected formatCustomInput(subsData: SubscriptionData): object {
        console.log("#### >>ProofOfPaymentGenerator.formatCustomInput");
        console.log("subsPlanId=%s, subsAge=%d", subsData.subsPlanID, subsData.subsAge);
        const zkutils = new ZkUtils();
        let input: InputPayPalObject = {
            payment_subs_id: zkutils.stringToBytes(subsData.subsPlanID), // payment plan id
            pa: zkutils.numberToBytes(subsData.subsAge, 4),
        };

        console.log("#### <<ProofOfPaymentGenerator.formatCustomInput");
        return input;
    }    
}