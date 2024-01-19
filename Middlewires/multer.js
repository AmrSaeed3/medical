// const multer = require("multer");
// const path = require("path");
// const diskStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // console.log("file", file);
//     cb(null, path.join(__dirname, "..", "uploads"));
//   },
//   filename(req, file, cb) {
//     const ext = file.mimetype.split("/")[1];
//     const fileName = `user-${Date.now()}.${ext}`;
//     cb(null, fileName);
//   },
// });
// const fileFilterimage = (req, file, cb) => {
//   const imageType = file.mimetype.split("/")[0];
//   if (imageType === "image") {
//     return cb(null, true);
//   } else {
//     return cb(appError.create("file must be a image", 400), false);
//   }
// };
// //upload avatar
// const upload = multer({
//   storage: diskStorage,
//   fileFilter: fileFilterimage,
// });

// const diskStorageWord = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // console.log("file", file);
//     cb(null, path.join(__dirname, "..", "file"));
//   },
//   filename(req, file, cb) {
//     cb(null, file.originalname);
//   },
// });
// const fileFilterWord = (req, file, cb) => {
//   const imageType = file.mimetype.split("/")[0];
//   if (imageType === "application") {
//     return cb(null, true);
//   } else {
//     return cb(appError.create("file must be a word", 400), false);
//   }
// };
// //upload word
// const upload2 = multer({
//   storage: diskStorageWord,
//   fileFilter: fileFilterWord,
// });
// module.exports = {
//   upload,
//   upload2,
// };
const multer = require("multer");
const path = require("path");
const appError = require("../utils/appError");

const storageConfig = (folderName, fileType) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "..", folderName));
    },
    filename(req, file, cb) {
      const imageType = file.mimetype.split("/")[0];
      // console.log(imageType)
      if (imageType === "image") {
        const ext = file.mimetype.split("/")[1];
        const fileName = `user-${Date.now()}.${ext}`;
        cb(null, fileName);
      } else if (imageType === "application") {
        cb(null, file.originalname);
      }
    },
  });
};
// لم يحل مشكلة ارسال خطا عندما ارسل اي نوع اخر من الملفات
const fileFilter = (req, file, cb, expectedType, errorMessage) => {
  const fileType = file.mimetype.split("/")[0];
  if (fileType === expectedType) {
    return cb(null, true);
  } else {
    return cb(appError.create(errorMessage, 400), false);
  }
};

// Upload Image
const uploadImage = multer({
  storage: storageConfig("uploads", "image"),
  fileFilter: (req, file, cb) => {
    fileFilter(req, file, cb, "image", "File must be an image");
  },
});

// Upload Word
const uploadWord = multer({
  storage: storageConfig("file", "application"),
  fileFilter: (req, file, cb) => {
    fileFilter(req, file, cb, "application", "File must be a Word document");
  },
});

module.exports = {
  uploadImage,
  uploadWord,
};
