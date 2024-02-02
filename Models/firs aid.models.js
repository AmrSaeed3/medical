const mongoose = require("mongoose");
const validator = require("validator");

const Chapters = new mongoose.Schema({
  name: String,
  extension: String,
  totalParagraphs: Number,
  paragraphs: Array,
});

const Images = new mongoose.Schema({
  name: String,
  extension: String,
  totalImages: Number,
  arrayPhotos: Array,
});

const data1 = mongoose.model("Chapters", Chapters);
const data2 = mongoose.model("Images", Images);
module.exports = {
  data1,
  data2,
};
