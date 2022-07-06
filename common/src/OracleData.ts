import { assert } from 'chai';
import { buildEddsa } from 'circomlibjs';

export default abstract class OracleData<Type> {
    protected abstract formatCustomInput(timeStamp: number, input: Type): number[]

    sign = async (
        signingKey: string,
        timestamp: number,
        customInput: Type
        //subsPlanID: string,
        //subsAge: number
    ): Promise<Array<any>> => {
        console.log("**** OracleData.sign");

        // oracle's signing key
        const eddsa = await buildEddsa();
        const prvKey = Buffer.from(signingKey, 'hex');
        const pubKey = eddsa.prv2pub(prvKey);

        // calculate the sig 
        const msg = this.formatCustomInput(timestamp, customInput);
        const signature = eddsa.signPedersen(prvKey, msg);
        const pSignature = eddsa.packSignature(signature); // this is the signature

        // assert (optional)
        const uSignature = eddsa.unpackSignature(pSignature);
        assert(eddsa.verifyPedersen(msg, uSignature, pubKey));
        const pSignatureArray = Array.from(pSignature);
        return pSignatureArray;
    };
}