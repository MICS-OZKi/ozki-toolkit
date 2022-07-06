pragma circom 2.0.0;

include "comparators.circom";
include "isbufferequal.circom";
include "eddsa.circom";
include "bitify.circom";

template ProveGoogleAuth(length, eddsaLength, bitsize) {
    // i/o signals
    signal input sigR8[256];
    signal input sigS[256];
    signal input domain[length];
    signal input ts[4];
    signal output timestamp;
    signal output out;

    // local vars
    // The expected google domain
    var EMAIL_DOMAIN_LENGTH = 9; 
    var EMAIL_DOMAIN[EMAIL_DOMAIN_LENGTH] = [  // "google.com"
	  103, 109, 97, 105,
	  108,  46, 99, 111,
	  109
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
    var msg[52];
    var msgBits[eddsaLength];
    var expected_domain[length];
    var tmstamp = ts[0] + ts[1]*256 + ts[2]*256*256 + ts[3]*256*256*256;

    // circom components
    component isSubsIdEqual = IsBufferEqual(length);
    //component isAgeGood = LessEqThan(32);
    component eddsaSignature = EdDSAVerifier(eddsaLength);
    component bits[52];

    // serialize inputs into 'msg' var
    for (var i = 0; i < 48; i++) {
        msg[i] = domain[i];
    }
    for (var i = 0; i < 4; i++) {
        msg[48+i] = ts[i];	// timestamp
    }

    // convert msg into msgBits
    for (var i = 0; i < 52; i++) {
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
    // verify domain
    // the payment's subscription id must match the expected one
    //
    for (var i = 0; i < EMAIL_DOMAIN_LENGTH; i++) {
        expected_domain[i] = EMAIL_DOMAIN[i];
    }
    for (var i = EMAIL_DOMAIN_LENGTH; i < length; i++) {
        expected_domain[i] = 32;
    }
    for (var i = 0; i < length; i++) {
        isSubsIdEqual.buffer1[i] <== domain[i];
        isSubsIdEqual.buffer2[i] <== expected_domain[i];
    }
    isSubsIdEqual.out === 1;
    status = status * isSubsIdEqual.out;

    timestamp <== tmstamp;
    out <== status;
}
