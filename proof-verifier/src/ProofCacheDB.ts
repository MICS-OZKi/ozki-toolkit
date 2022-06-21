import * as mongoDB from "mongodb";
import {
  DB_COLLECTION_NAME,
  DB_CONN_STRING,
  DB_NAME,
  MAX_PROOF_AGE,
} from "./config";

class DB {
  db: any = null;
  instance = 0;

  connectToDatabase() {
    const client = new mongoDB.MongoClient(DB_CONN_STRING);
    client.connect();
    const database = client.db(DB_NAME);

    console.log(`Successfully connected to database: ${database.databaseName}`);

    return database;
  }

  Get() {
    try {
      this.instance++; // this is just to count how many times our singleton is called.
      console.log(`DbConnection called ${this.instance} times`);

      if (this.db != null) {
        console.log(`db connection is already alive`);
        return this.db.collection(DB_COLLECTION_NAME);
      } else {
        console.log(`getting new db connection`);
        this.db = this.connectToDatabase();
        const proofCollection = this.db.collection(DB_COLLECTION_NAME);
        try {
          proofCollection.createIndex(
            { createdAt: 1 },
            {
              name: "Automatic Expired",
              expireAfterSeconds: MAX_PROOF_AGE * 60 + 10,
            }
          );
        } catch (error) {
          console.log(error);
        }

        return proofCollection;
      }
    } catch (e) {
      throw Error("error connecting to Database");
    }
  }
}

const db = new DB();

export default db;

