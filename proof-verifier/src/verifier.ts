import * as snarkjs from "snarkjs";
import * as fs from "fs";

import { ZkUtils } from "../../common/src/";
import db from "./ProofCacheDB";
import { createHash } from "crypto";
import { MAX_PROOF_AGE } from "./config";
import verificationKeyString from "./VerificationKey";

class Verifier {
  proofDB = db.Get();
  verifyProof = async (
    proof: string,
    publicSignals: string,
    verificationKeyFilePath: string
  ): Promise<boolean> => {
    console.log("#### proof verification started...");
    console.log("verificationKeyFilePath=%s", verificationKeyFilePath);
    const t1 = new Date().getTime();

    console.log("#### checking for dup proof...");
    const proofHash = createHash("sha256")
      .update(JSON.stringify(proof))
      .digest("base64");
    const query = { hash: proofHash };
    const result = await this.proofDB.findOne(query);
    if (result) {
      console.log("#### dup proo found!");
      throw Error("Duplicate proof found. Possible replay attack!");
    }

    //const verificationKey = JSON.parse("{ \"protocol\": \"groth16\", \"curve\": \"bn128\", \"nPublic\": 2, \"vk_alpha_1\": [ \"3661071354412086860163890696472230639515484609482695256317587741765175362240\", \"11981730332002299874200990947733514088241679742204438504346983014598093952072\", \"1\" ], \"vk_beta_2\": [ [ \"19628247528879455523416786264455811665722480898045497832300062312504384828024\", \"2365090159449231435248277709354443054746861686465897067236783304366600311432\" ], [ \"11840408111542450856921338740459728031491496516630256628963359111232427231105\", \"4691010980258507125564646704474382098942759174253728521951486868744104196706\" ], [ \"1\", \"0\" ] ], \"vk_gamma_2\": [ [ \"10857046999023057135944570762232829481370756359578518086990519993285655852781\", \"11559732032986387107991004021392285783925812861821192530917403151452391805634\" ], [ \"8495653923123431417604973247489272438418190587263600148770280649306958101930\", \"4082367875863433681332203403145435568316851327593401208105741076214120093531\" ], [ \"1\", \"0\" ] ], \"vk_delta_2\": [ [ \"11452211790066414482608046577115287776225599350910617892109247438694464520710\", \"5472774855330368476020377921304750737217607842916961640892954165035777194335\" ], [ \"18087878785001894744727002624094442627906288445691404321591441368795499975878\", \"1964925821313506843337426397277625844305517509651277798834401410692822069152\" ], [ \"1\", \"0\" ] ], \"vk_alphabeta_12\": [ [ [ \"4048131543410645496819148595483663922433951962601461212944196707206573713918\", \"10091945318870832126543492366015552763556878659271643589855386742967000569956\" ], [ \"13950178045965546096695715782024880236898820353336981540806899457977829995250\", \"1092333533741343703107851615453723281721403122436180705535800330214953232775\" ], [ \"20708111942001128306371006797825964245386279547205817720297945646081777511267\", \"3789702846527011106426363154803177023952772998646390438226554396276097590945\" ] ], [ [ \"20171943015214324357650640703057302297793376746635812505619190018391671853377\", \"17826984963068633389499089216166258317483823163328750660439017436568553400985\" ], [ \"1106540286269739468771801131002947386525166467613357521374494372532654340732\", \"15825371303521913941510644915737670937859005935696152312730217284673863591736\" ], [ \"6775152695282356002765214629665438434193730037029650314287902316955595126270\", \"9704690603889890368572458405892498278183908444962387891513484147481736067162\" ] ] ], \"IC\": [ [ \"7204741158621016433341465841422722444280659619067920709939049288925412486218\", \"6934071964974633724496378506252925707349521546097516276017951208159304981759\", \"1\" ], [ \"1047713523579767322838103181827678222032528577597911780329909142733977757118\", \"21698911961404917824075861699527766552243545388991969971892757715040309972615\", \"1\" ], [ \"18377471793735673994256261379135371463077311932431408096149252029475814961642\", \"8050396716295194789640217365056262520916171001300706249907660283788951821197\", \"1\" ] ] }");
    const verificationKey = JSON.parse(verificationKeyString);

    //   verify the proof and output
    /*
    const verificationKey = JSON.parse(
      fs.readFileSync(verificationKeyFilePath).toString()
    );
    */

    console.log("#### calling groth16.verify...");
    let res;
    try {
      res = await snarkjs.groth16.verify(
      verificationKey,
      publicSignals,
      proof
      );
    }
    catch (error) {
      console.log("#### groth16.verify failed");
      console.log(error);
      throw Error("Proof verification failed");
    }

    if (res) {
      // fail the proof if it's older than maxProoAge
      const [paymentStatus, timeStamp] = publicSignals;
      let ts = Number.parseInt(timeStamp);
      let now = Math.floor(new Date().getTime() / 1000);
      console.log("#### checking proof Age");
      if (now - ts > MAX_PROOF_AGE * 60) {
        console.log("#### proof has expired!");
        throw Error("Proof has expired!");
      } 
      else {
        let status = Number.parseInt(paymentStatus);
        res = status ? true : false;

        if (res) {
          console.log("#### adding proof to cache db");
          await this.proofDB.insertOne({
            hash: proofHash,
            createdAt: new Date(),
          });
        }
      const t2 = new Date().getTime();
      console.log("#### verification completed in %d ms", t2-t1);
      }
    }
    else {
      console.log("#### groth16.verify failed");
      throw Error("The call to groth16.verify failed.");
    }
    return res;
  };

  printVerifier = () => {
    new ZkUtils().print("This is Verifier");
  };
}

export default Verifier;
