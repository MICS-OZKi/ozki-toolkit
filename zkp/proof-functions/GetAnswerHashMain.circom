pragma circom 2.0.0;

include "../circuits/GetAnswerHash.circom";

component main = GetAnswerHash(48); // max string length is 48 chars
