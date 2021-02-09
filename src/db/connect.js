const { connect: connectMongo } = require('mongoose');

exports.connect = () => {
  (async () => {
    try {
      const conn = await connectMongo(process.env.MONGO_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true
      });

      console.log(`Connected to MongoDB on host ${conn.connection.host}`);
    } catch (err) {
      console.log('CANNOT CONNECT TO MONGO DB\n', err)
    }
  })();
}
