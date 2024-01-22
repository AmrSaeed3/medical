const mongoose = require("mongoose");
const validator = require("validator");

const Chapters = new mongoose.Schema({
  name: String,
  extension:String,
  totalParagraphs: Number,
  paragraphs: Array,
});
const user1 = mongoose.model("Chapters", Chapters);

module.exports = {
  user1,
};
