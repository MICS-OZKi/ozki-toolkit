pragma circom 2.0.0;

include "comparators.circom";
include "isbufferequal.circom";
include "eddsa.circom";
include "bitify.circom";

template IsSubscriptionGood(length, eddsaLength, bitsize) {
    // i/o signals
    signal input sigR8[256];
    signal input sigS[256];
    signal input payment_subs_id[length];
    signal input pa[4];
    signal input ts[4];
    signal output out;
    signal output timestamp;

    // local vars
    var PAYPAL_SUBSCRIPTION_PERIOD = 365;   // 1 year
    var PAYPAL_SUBSCRIPTION_ID_LENGTH = 26; // subs id is fixed at 26 chars
    // The expected Paypal's subscription id (P-1BF08962SE3742350MKRYCVQ)
    var PAYPAL_SUBSCRIPTION_ID[PAYPAL_SUBSCRIPTION_ID_LENGTH] = [ 
      80, 45, 49, 66, 70, 48, 56, 57, 54, 50, 83, 69, 51, 55, 52, 50,
      51, 53, 48, 77, 75, 82, 89, 67, 86, 81
      ];

    // The oracle's digital signature verification key
    var ORACLE_DSAVER_KEY[256] = [0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0,
        0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0,
        1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0,
        0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1,
        1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1,
        1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1,
        1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1,
        1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1,
        0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0,
        1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0,
        1];
    var status = 1;
    var msg[56];
    var msgBits[eddsaLength];
    var expected_subs_id[length];
    var tmstamp = ts[0] + ts[1]*256 + ts[2]*256*256 + ts[3]*256*256*256;
    var payment_age = pa[0] + pa[1]*256 + pa[2]*256*256 + pa[3]*256*256*256;

    // circom components
    component isSubsIdEqual = IsBufferEqual(length);
    component isAgeGood = LessEqThan(32);
    component eddsaSignature = EdDSAVerifier(eddsaLength);
    component bits[56];

    // serialize inputs into 'msg' var
    for (var i = 0; i < 48; i++) {
        msg[i] = payment_subs_id[i];
    }
    for (var i = 0; i < 4; i++) {
        msg[48+i] = pa[i];	// payment age
        msg[52+i] = ts[i];	// timestamp
    }

    // convert msg into msgBits
    for (var i = 0; i < 56; i++) {
        //log(i);
        bits[i] = Num2Bits(bitsize);
        bits[i].in <== msg[i];
        for (var j = 0; j < bitsize; j++) {
            //log(i*bitsize+j);
	    msgBits[i*bitsize + j] = bits[i].out[j];
        }
    }

    //
    // Verify the signature
    //
    for (var i = 0; i < 256; i++) {
        eddsaSignature.A[i] <== ORACLE_DSAVER_KEY[i];
	eddsaSignature.R8[i] <== sigR8[i];
	eddsaSignature.S[i] <== sigS[i];
    }
    for (var i = 0; i < eddsaLength; i++) {
        eddsaSignature.msg[i] <== msgBits[i];
    }
    // eddsaSignature will error out right here if the sig ver fails

    //
    // verify payment_age
    // payment age has to be equal or less than the expected age
    //
    isAgeGood.in[0] <== payment_age;
    isAgeGood.in[1] <== PAYPAL_SUBSCRIPTION_PERIOD;
    isAgeGood.out === 1;
    status = status * isAgeGood.out;

    //
    // verify payment_subs_id
    // the payment's subscription id must match the expected one
    //
    for (var i = 0; i < PAYPAL_SUBSCRIPTION_ID_LENGTH; i++) {
        expected_subs_id[i] = PAYPAL_SUBSCRIPTION_ID[i];
    }
    for (var i = PAYPAL_SUBSCRIPTION_ID_LENGTH; i < length; i++) {
        expected_subs_id[i] = 32;
    }
    for (var i = 0; i < length; i++) {
        isSubsIdEqual.buffer1[i] <== payment_subs_id[i];
        isSubsIdEqual.buffer2[i] <== expected_subs_id[i];
    }
    isSubsIdEqual.out === 1;
    status = status * isSubsIdEqual.out;

    timestamp <== tmstamp;
    out <== status;
}
