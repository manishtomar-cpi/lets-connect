// lib/mongodb.js
const mongoose = require('mongoose');

const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return mongoose.connection.asPromise();
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
};

module.exports = connectMongo;
