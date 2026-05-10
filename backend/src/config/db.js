const mongoose = require('mongoose');

// Connects to MongoDB using the URI from environment variables.
// Exits the process on failure so the server doesn't run without a DB.
// Returns the mongoose connection so callers can chain follow-up tasks
// (e.g., one-time seed jobs that run only after the DB is up).
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
