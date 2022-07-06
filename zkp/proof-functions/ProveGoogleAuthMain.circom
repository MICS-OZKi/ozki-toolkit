pragma circom 2.0.0;

include "../circuits/ProveGoogleAuth.circom";

component main = ProveGoogleAuth(48, (48+4)*8, 8);
