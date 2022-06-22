pragma circom 2.0.0;

include "../circuits/ProvePayPalSubscription.circom";

component main = ProvePayPalSubscription(48, (48+4+4)*8, 8);
