import * as mongoDB from "mongodb";
import { createHash } from "crypto";
import {
  DB_COLLECTION_NAME,
  DB_CONN_STRING,
  DB_NAME,
  MAX_PROOF_AGE,
} from "./config";
export class ProofCacheDB {
  private static instance: ProofCacheDB;
  private static initialized = false; 
  private db: any = null;

  static getInstance(): ProofCacheDB {
    if (!ProofCacheDB.initialized) {
      ProofCacheDB.instance = new ProofCacheDB();
      ProofCacheDB.initialized = true;
      console.log("#### ProofCacheDB instance created")
    }

    return ProofCacheDB.instance;
  }

  private constructor() {
    this.connectToDatabase();
  }

  findProof = async (
    proof: string,
    publicSignals: string
  ): Promise<boolean> => {
    let result = false;
    console.log(">> findProof");
    const proofHash = createHash("sha256")
      .update(proof + publicSignals)
      .digest("base64");
    const query = { hash: proofHash };
    console.log("hash=%s", proofHash.toString())
    const coll = this.db.collection(DB_COLLECTION_NAME);
    result = await coll.findOne(query);
    console.log("result=%s", result);
    console.log("<< findProof");
    return result;
  }

  addProof = async (
    proof: string,
    publicSignals: string
  ): Promise<void> => {
    console.log(">> addProof");
    const proofHash = createHash("sha256")
      .update(proof + publicSignals)
      .digest("base64");

    console.log("hash=%s", proofHash.toString())
    const coll = this.db.collection(DB_COLLECTION_NAME);
    await coll.insertOne({
      hash: proofHash,
      createdAt: new Date(),
    });
    console.log("<< addProof");
  }

  private connectToDatabase() {
    if (!this.db) {
      const client = new mongoDB.MongoClient(DB_CONN_STRING);
      client.connect();
      const database = client.db(DB_NAME);
      console.log(`#### connected to db: ${database.databaseName}`);
      this.db = database;
      const coll = this.db.collection(DB_COLLECTION_NAME);

      try {
        coll.createIndex(
          { createdAt: 1 },
          {
            name: "Automatic Expired",
            expireAfterSeconds: MAX_PROOF_AGE * 60 + 10,
          }
        );
      console.log("#### collection created");
      }
      catch (error) {
        console.log(error);
      }
    }
    else {
      console.log("#### collection retrieved");
    }
  }
}
