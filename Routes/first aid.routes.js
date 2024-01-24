const express = require("express");
const router = express.Router();
const { uploadWord } = require("../Middlewires/multer");

const firstAidController = require("../Controllers/first aid.controllers");
router
  .route("/addChapter")
  .post(uploadWord.single("chapter"), firstAidController.addChapter);
router
  .route("/addChapterpdf")
  .post(uploadWord.single("chapter"), firstAidController.addChapterpdf);
router.route("/readAll/:name").get(firstAidController.allChapter);
router.route("/read-Chapter/:name/:num").get(firstAidController.chapter);
module.exports = router;
