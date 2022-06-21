pragma circom 2.0.0;

include "../circuits/is_subscription_good.circom";

component main = IsSubscriptionGood(48, (48+4+4)*8, 8);
