const express = require("express");
const router = express.Router();
const { uploadWord } = require("../Middlewires/multer");

const firstAidController = require("../Controllers/first aid.controllers");
router
  .route("/addChapter")
  .post(uploadWord.single("chapter 1"), firstAidController.addChapter);
router.route("/readAllChapter1").get(firstAidController.allChapter1);
router.route("/read-Chapter1/:num").get(firstAidController.chapter1);
module.exports = router;
