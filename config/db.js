
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

let db;
let connectionPromise;

const connectDB = async () => {
  try {
    if (!connectionPromise) {
      connectionPromise = client.connect().catch((error) => {
        connectionPromise = null;
        throw error;
      });
    }

    await connectionPromise;

    if (!db) {
      db = client.db("booknookDB");
      console.log("MongoDB Connected Successfully!");
    }

    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;
