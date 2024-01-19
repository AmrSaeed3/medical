const User = require("../Models/firs aid.models");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const appError = require("../utils/appError");
const statusText = require("../utils/httpStatus");

const addShapter = async (req, res, next) => {
  if (!req.file) {
    const error = appError.create(
      "The file was not uploaded",
      400,
      statusText.FAIL
    );
    return next(error);
  }
  const uploadedFile = req.file;
  const paragraphMarker = "@"; // يمكنك تغيير هذا إلى الرمز الذي قمت بوضعه في ملف Word
  const filePath = req.file.filename;

  if (!filePath) {
    const error = appError.create(
      "File path must be provided",
      400,
      statusText.ERROR
    );
    return next(error);
  }

  const absolutePath = path.resolve(__dirname, "..", "file", filePath);

  fs.readFile(absolutePath, "utf-8", (err, data) => {
    if (err) {
      const error = appError.create(
        "An error occurred while reading the file",
        500,
        statusText.ERROR
      );
      return next(error);
    }

    mammoth
      .extractRawText({ path: absolutePath })
      .then(async (result) => {
        const paragraphs = result.value.split(paragraphMarker);
        // إضافة ترقيم لكل فقرة
        const numberedParagraphs = paragraphs.map((paragraph, index) => {
          const paragraphNumber = index + 1;
          return { pageNumber: paragraphNumber, text: paragraph };
        });
        const name = uploadedFile.fieldname;
        const shapter = await User.user1.findOne({ name: name });
        if (shapter) {
          const error = appError.create(
            "this shapter is already exist",
            400,
            statusText.FAIL
          );
          return next(error);
        }
        const newaway = new User.user1({
          name: name,
          paragraphs: numberedParagraphs,
          totalParagraphs: paragraphs.length,
        });
        await newaway.save();

        // ارسل النص المرقم والفقرة المحددة
        res.json({
          message: "The file has been uploaded successfully.",
          paragraphs: numberedParagraphs,
          totalParagraphs: paragraphs.length,
        });
      })
      .catch((err) => {
        const error = appError.create(
          "An error occurred while processing the file",
          500,
          statusText.ERROR
        );
        return next(error);
      });
  });
};
//modify size page
// const shapter1 = (req, res) => {
//   // const pageSize = 200; // حجم الصفحة
//   const paragraphMarker = "@"; // يمكنك تغيير هذا إلى الرمز الذي قمت بوضعه في ملف Word

//   const filePath = "YOUR DOC DATA.docx";
//   const page = req.params.num;

//   if (!filePath) {
//     return res.status(400).json({ error: "يجب توفير مسار الملف" });
//   }

//   const absolutePath = path.resolve(__dirname, "..", "file", filePath);

//   fs.readFile(absolutePath, "utf-8", (err, data) => {
//     if (err) {
//       return res.status(500).json({ error: "حدث خطأ أثناء قراءة الملف" });
//     }

//     mammoth
//       .extractRawText({ path: absolutePath })
//       .then((result) => {
//         // const text = result.value;
//         const paragraphs = result.value.split(paragraphMarker);
//         // حساب النص للصفحة المطلوبة لو استخدمنا size معين
//         // const start = (page - 1) * pageSize;
//         // const end = start + pageSize;
//         // const pageText = text.split(' ').slice(start, end).join(' ');
//         // res.send(pageText);
//         // res.json({ text: pageText, page, totalPages: Math.ceil(text.split(' ').length / pageSize) });

//         const start = page - 1;
//         const end = start + 1;
//         const pageParagraph = paragraphs
//           .slice(start, end)
//           .join(paragraphMarker);
//         res.json({ text: pageParagraph, page, totalPages: paragraphs.length });
//       })
//       .catch((error) => {
//         res.status(500).json({ error: "حدث خطأ أثناء معالجة الملف" });
//       });
//   });
// };

const allShapter1 = async (req, res, next) => {
  const shapter = await User.user1.findOne({ name: "Shapter 1" });
  if (!shapter) {
    const error = appError.create(
      "this shapter not found try again !",
      401,
      statusText.FAIL
    );
    return next(error);
  }
  res.json(shapter);
};
const shapter1 = async (req, res, next) => {
  const numbers = req.params.num;
  const shapter = await User.user1.findOne({ name: "Shapter 1" });
  if (!shapter) {
    const error = appError.create(
      "this shapter not found try again !",
      401,
      statusText.FAIL
    );
    return next(error);
  }
  res.json({
    data: shapter.paragraphs[numbers - 1],
    totalParagraphs: shapter.totalParagraphs,
  });
};
module.exports = {
  addShapter,
  allShapter1,
  //   shapter1,
  shapter1,
};
