require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 1000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
};