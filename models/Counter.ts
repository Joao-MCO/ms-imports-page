import mongoose, { Document, Schema } from "mongoose";

export interface ICounter extends Document {
  name: string;
  seq: number;
}

const counterSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  seq: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Counter = (mongoose.models.Counter as mongoose.Model<ICounter>) || mongoose.model<ICounter>("Counter", counterSchema);

export default Counter;

export async function getNextSequence(name: string) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );
  return counter.seq;
}