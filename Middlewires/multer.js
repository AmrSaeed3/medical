const multer = require("multer");
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log("file", file);
    cb(null, "uploads");
  },
  filename(req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const fileName = `user-${Date.now()}.${ext}`;
    cb(null, fileName);
  },
});
const fileFilter = (req, file, cb) => {
  const imageType = file.mimetype.split("/")[0];
  if (imageType === "image") {
    return cb(null, true);
  } else {
    return cb(appError.create("file must be a image", 400), false);
  }
};
//upload avatar
const upload = multer({
  storage: diskStorage,
  fileFilter: fileFilter,
});

module.exports = {
  upload,
};
