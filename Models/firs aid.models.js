const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: String,
  paragraphs: Array,
  totalParagraphs: String,
});

const user1 = mongoose.model("Shapters", userSchema);

module.exports = {
  user1,
};
