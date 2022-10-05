import { connect } from 'mongoose';

export const mongoConnect = async () => {
  try {
    const { connection } = await connect(process.env.MONGO_URI);

    console.log(`Conneceted to MongoDB at ${connection.host}`);
  } catch (err) {
    throw err;
  }
}
