require('dotenv').config();
const mongoose = require("mongoose");

const connectdb = async (dbName) => {
    try {
        const dbURI = process.env.MONGODB_URI;
        await mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log(`Successfully connected to MongoDB database: ${dbName}`);
    } catch (error) {
        console.error(`Could not connect to MongoDB database: ${dbName}`, error);
        process.exit(1);
    }
};

module.exports = connectdb;
