pragma circom 2.0.0;

include "comparators.circom";

template IsBufferEqual(length) {
    // i/o signals
    signal input buffer1[length];
    signal input buffer2[length];
    signal output out;

    var sum = 0;
    component isEqual[length];

    for (var i = 0; i < length; i++) {
        isEqual[i] = IsEqual();
        isEqual[i].in[0] <== buffer1[i];
        isEqual[i].in[1] <== buffer2[i];
        sum = sum + isEqual[i].out;
    }
    assert(sum <= length);

    component isSumEqual = IsEqual();
    isSumEqual.in[0] <== sum;
    isSumEqual.in[1] <== length;
    out <== isSumEqual.out;
}
