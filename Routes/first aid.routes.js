const express = require("express");
const router = express.Router();
const { uploadWord } = require("../Middlewires/multer");

const firstAidController = require("../Controllers/first aid.controllers");
router
  .route("/addChapterword")
  .post(uploadWord.single("chapter"), firstAidController.addChapterword);

router
  .route("/addChapterpdf")
  .post(uploadWord.single("chapter"), firstAidController.addChapterpdf);

router.route("/readAll/:name").get(firstAidController.allChapter);

router.route("/read-one-chapter/:name/:num").get(firstAidController.onechapter);


router
  .route("/addQuiz")
  .post(uploadWord.single("quiz"), firstAidController.addQuiz);

router.route("/readAllquiz/:name").get(firstAidController.allquiz);

router.route("/read-one-quiz/:name/:num").get(firstAidController.onequiz);
router.route("/getarray").get(firstAidController.addchat);

module.exports = router;
