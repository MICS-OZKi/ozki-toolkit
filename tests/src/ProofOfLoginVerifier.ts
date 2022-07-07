import  ProofVerifier from "ozki-lib";

export class ProofOfLoginVerifier extends ProofVerifier<void> {
    constructor(
        zkpComponentPath: string,
        zkpComponentName: string
        ) {
        console.log("#### >>ProofOfLoginVerifier.ctor:");
        super(zkpComponentPath, zkpComponentName);
        console.log("#### <<ProofOfLoginVerifier.ctor:");
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