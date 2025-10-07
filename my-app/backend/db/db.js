const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin';

const options = {
  maxPoolSize: 20,  // Similar to connectionLimit
  minPoolSize: 5,
  waitQueueTimeoutMS: 10000 // Similar to queueLimit in concept
};

const client = new MongoClient(uri, options);

const testConnection = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB database successfully!');

    // Optional: check connection with a simple ping
    const db = client.db(process.env.DB_NAME);
    await db.command({ ping: 1 });

  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
  }
};

module.exports = client;

// Optional: uncomment to test connection on start
// testConnection();
