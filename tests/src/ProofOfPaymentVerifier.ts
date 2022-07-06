import  ProofVerifier from "ozki-lib";

export class ProofOfPaymentVerifier extends ProofVerifier<void> {
    constructor(
        zkpComponentPath: string,
        zkpComponentName: string
        ) {
        console.log("#### >>ProofOfPaymentVerifier.ctor:");
        super(zkpComponentPath, zkpComponentName);
        console.log("#### <<ProofOfPaymentVerifier.ctor:");
    }


    /*
    parseCustomOutput(customOutput: Array<string|null>): void {
        console.log("#### >>ProofOfPaymentVerifier.parseCustomOutput:");
        console.log("#### customOutput: len=%d, val=%s", customOutput.length, customOutput);
        let status = false;

        if (customOutput.length == 2) {
            const [timeStamp, paymentStatus] = customOutput;
            const number = Number.parseInt(paymentStatus);
            status = (number == 1);
        }

        console.log("#### <<ProofOfPaymentVerifier.parseCustomOutput: status=%s", status);
        return status;
    }
    */
}