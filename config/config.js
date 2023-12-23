// config.js
require("dotenv").config();
module.exports = {
  google: {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALL_BACK_URL,
  },
  facebook :{
    clientID: process.env.CLIENT_ID2,
    clientSecret:  process.env.CLIENT_SECRET2,
    callbackURL: process.env.CALL_BACK_URL2,
    profileFields: ["id", "displayName", "email"],
  },
  session: {
    secret: process.env.JWT_SECLET_KEY,
  },
};
