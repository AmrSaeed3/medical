const mongoose = require("mongoose");
const validator = require("validator");

const Chapters = new mongoose.Schema({
  totalParagraphs: Number,
  name: String,
  extension:String,
  paragraphs: Array,
});
const user1 = mongoose.model("Chapters", Chapters);

module.exports = {
  user1,
};
