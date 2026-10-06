import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Por favor, defina a variável de ambiente MONGODB_URI");
}

declare global {
  var mongoClient: Promise<MongoClient> | undefined;
}

const clientPromise: Promise<MongoClient> = (() => {
  if (!global.mongoClient) {
    const client = new MongoClient(process.env.MONGODB_URI!);
    global.mongoClient = client.connect();
  }
  return global.mongoClient!;
})();

let mongooseConn: typeof import("mongoose") | null = null;
let mongoosePromise: Promise<typeof import("mongoose")> | null = null;

async function connectDB(): Promise<typeof import("mongoose")> {
  if (mongooseConn) {
    return mongooseConn;
  }

  if (!mongoosePromise) {
    const mongoose = await import("mongoose");
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    const uri = process.env.MONGODB_URI!;
    const dbName = process.env.MONGODB_DATABASE;
    const connectionString = dbName ? `${uri}${dbName}` : uri;
    
    mongoosePromise = mongoose.connect(connectionString, opts).then((m) => {
      mongooseConn = m;
      return m;
    });
  }

  try {
    mongooseConn = await mongoosePromise!;
  } catch (e) {
    mongoosePromise = null;
    throw e;
  }

  return mongooseConn!;
}

export { clientPromise, connectDB };
export default connectDB;