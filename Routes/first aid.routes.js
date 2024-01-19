const express = require("express");
const router = express.Router();
const { uploadWord } = require("../Middlewires/multer");

const firstAidController = require("../Controllers/first aid.controllers");
router.route("/addShapter").post(uploadWord.single('shapter 1'),firstAidController.addShapter)
router.route("/readAllShapter1").get(firstAidController.allShapter1)
router.route("/read-Shapter1/:num").get(firstAidController.shapter1)
module.exports = router;