pragma circom 2.0.0;
include "mimcsponge.circom";

//
// Note: this circom program needs powersoftau with 17-bit
//

template GetAnswerHash(length) {
    var output_length = length*4/3;

    // i/o signals
    signal input ts[4];
    signal input answer_no;
    signal input answer[length];
    signal output timestamp;
    signal output number;
    signal output hash[output_length];

    component mimcsponge = MiMCSponge(length, 220, output_length);
    mimcsponge.k <== 0;
    for (var i = 0; i < length; i++) {
        mimcsponge.ins[i] <== answer[i];
    }

    var tmstamp = ts[0] + ts[1]*256 + ts[2]*256*256 + ts[3]*256*256*256;
    timestamp <== tmstamp;
    number <== answer_no;
    for (var i = 0; i < output_length; i++) {
        hash[i] <== mimcsponge.outs[i];
    }
}
