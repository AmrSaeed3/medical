const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: String,
  extension:String,
  paragraphs: Array,
  totalParagraphs: String,
});
const user1 = mongoose.model("Chapters", userSchema);

module.exports = {
  user1,
};
