const { MongoClient } = require("mongodb");

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGO_DB_NAME || "Betty_Tatto";

const client = new MongoClient(mongoUri);

let db;

async function connectToMongo() {
  if (db) {
    return db;
  }

  await client.connect();
  db = client.db(mongoDbName);

  await Promise.all([
    db
      .collection("users")
      .createIndex({ usernameNormalized: 1 }, { unique: true }),
    db.collection("bookings").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("bookings").createIndex({ status: 1, createdAt: -1 }),
  ]);

  console.log(`MongoDB conectado (${mongoDbName}).`);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error("MongoDB aun no esta conectado.");
  }

  return db;
}

module.exports = {
  connectToMongo,
  getDb,
};
