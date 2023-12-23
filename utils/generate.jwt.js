const jwt = require("jsonwebtoken");

require("dotenv").config();
secretKey = process.env.JWT_SECLET_KEY;
const generate = async (payload) => {
  const expireIn = "3m";
  const token = await jwt.sign(payload, secretKey, { expiresIn: expireIn });
  const expireData = jwt.decode(token).exp * 1000 - Date.now();
  return { expireData, token: token, expireIn };
};
const generatequicly = async (payload) => {
  const expireIn = "10s";
  const token = await jwt.sign(payload, secretKey, { expiresIn: expireIn });
  const expireData = jwt.decode(token).exp * 1000 - Date.now();
  return { expireData, token: token, expireIn };
};

module.exports = {
  generate,
  generatequicly,
};
