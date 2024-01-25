const { user1 } = require("../Models/firs aid.models");
const mammoth = require("mammoth");
const pdf = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const appError = require("../utils/appError");
const statusText = require("../utils/httpStatus");
const chapterModel = user1;

const addChapter = async (req, res, next) => {
  if (!req.file) {
    const error = appError.create(
      "The file was not uploaded",
      400,
      statusText.FAIL
    );
    return next(error);
  }
  const paragraphMarker = "#"; // يمكنك تغيير هذا إلى الرمز الذي قمت بوضعه في ملف Word
  const filePath = req.file.filename;
  const name = filePath.split(".")[0];
  const extension = filePath.split(".")[1];
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
          const lines = paragraph.split("\n");
          const firstLine = lines.length > 0 ? lines[0].trim() : "";

          function extractLetters(sentence) {
            // استخراج الحروف فقط
            const lettersOnly = sentence.replace(/[^a-zA-Z\s]/g, "");
            //إزالة المسافة في بداية الجملة
            const cleanedSentence = lettersOnly
              .replace(/^\s+/, "")
              .replace(/\s+$/, "");
            return cleanedSentence;
          }

          const result = extractLetters(firstLine);
          // const currentPhoto = `${req.protocol}://${req.get(
          //   "host"
          // )}/uploads/${name}/${result}.png`;
          const currentPhoto = `${result}.png`;
          return {
            pageNumber: paragraphNumber,
            title: firstLine,
            text: paragraph.replace(firstLine, "").trim(),
            currentPhoto: currentPhoto,
          };
        });
        const chapter = await chapterModel.findOne({ name: name });
        if (chapter) {
          const fileName = req.file.filename; // اسم الملف الذي تريد حذفه
          const filePathToDelete = path.join(__dirname, "..", "file", fileName); // تحديد الملف بناءً على المجلد الجذر
          fs.unlink(filePathToDelete, (err) => {
            if (err) {
              const error = appError.create(
                "wrong in the delete data",
                400,
                httpStatus.FAIL
              );
              return next(error);
            }
          });
          const error = appError.create(
            "this chapter is already exist",
            400,
            statusText.FAIL
          );
          return next(error);
        }
        const newaway = new chapterModel({
          name: name,
          extension: extension,
          totalParagraphs: paragraphs.length,
          paragraphs: numberedParagraphs,
        });
        await newaway.save();

        // ارسل النص المرقم والفقرة المحددة
        res.json({
          message: "The file has been uploaded successfully.",
          name: name,
          totalParagraphs: paragraphs.length,
          paragraphs: numberedParagraphs,
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
// const chapter1 = (req, res) => {
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

const allChapter = async (req, res, next) => {
  const name = req.params.name;
  const currentPhoto = `${req.protocol}://${req.get("host")}/uploads/${name}`;
  const chapter = await chapterModel.findOne(
    { name: name },
    { __v: false, _id: false, extension: false }
  );
  chapter.paragraphs.forEach((paragraph) => {
    paragraph.currentPhoto = `${currentPhoto}/${paragraph.currentPhoto}`;
  });
  if (!chapter) {
    const error = appError.create(
      "this chapter not found try again !",
      401,
      statusText.FAIL
    );
    return next(error);
  }
  res.json(chapter);
};
const chapter = async (req, res, next) => {
  const numbers = req.params.num;
  const name = req.params.name;
  const chapter = await chapterModel.findOne({ name: name });
  const currentPhoto = `${req.protocol}://${req.get("host")}/uploads/${name}`;
  chapter.paragraphs.forEach((paragraph) => {
    paragraph.currentPhoto = `${currentPhoto}/${paragraph.currentPhoto}`;
  });
  if (!chapter) {
    const error = appError.create(
      "this chapter not found try again !",
      401,
      statusText.FAIL
    );
    return next(error);
  }
  res.json({
    totalParagraphs: chapter.totalParagraphs,
    data: chapter.paragraphs[numbers - 1],
  });
};
const addChapterpdf = async (req, res, next) => {
  if (!req.file) {
    const error = appError.create(
      "The file was not uploaded",
      400,
      statusText.FAIL
    );
    return next(error);
  }
  const paragraphMarker = "#"; // يمكنك تغيير هذا إلى الرمز الذي قمت بوضعه في ملف Word
  const filePath = req.file.filename;
  const name = filePath.split(".")[0];
  const extension = filePath.split(".")[1];
  if (!filePath) {
    const error = appError.create(
      "File path must be provided",
      400,
      statusText.ERROR
    );
    return next(error);
  }

  const absolutePath = path.resolve(__dirname, "..", "file", filePath);
  // قراءة محتوى الملف PDF
  fs.readFile(absolutePath, (err, data) => {
    if (err) {
      const error = appError.create(
        "An error occurred while reading the file",
        500,
        statusText.ERROR
      );
      return next(error);
    }
    // استخدام مكتبة pdf-parse لتحليل الملف
    pdf(data)
      .then(async (result) => {
        // data.text يحتوي على نص الملف
        const paragraphs = result.text.split(paragraphMarker);
        // إضافة ترقيم لكل فقرة
        const numberedParagraphs = paragraphs.map((paragraph, index) => {
          const paragraphNumber = index + 1;
          const lines = paragraph.split("\n");
          const firstLine = lines.length > 0 ? lines[0].trim() : "";

          function extractLetters(sentence) {
            // استخراج الحروف فقط
            const lettersOnly = sentence.replace(/[^a-zA-Z\s]/g, "");
            //إزالة المسافة في بداية الجملة
            const cleanedSentence = lettersOnly
              .replace(/^\s+/, "")
              .replace(/\s+$/, "");
            return cleanedSentence;
          }

          const result = extractLetters(firstLine);
          const currentPhoto = `${req.protocol}://${req.get(
            "host"
          )}/uploads/${name}/${result}.png`;
          return {
            pageNumber: paragraphNumber,
            title: firstLine,
            text: paragraph.replace(firstLine, "").trim(),
            currentPhoto: currentPhoto,
          };
        });
        const chapter = await chapterModel.findOne({ name: name });
        if (chapter) {
          const fileName = req.file.filename; // اسم الملف الذي تريد حذفه
          const filePathToDelete = path.join(__dirname, "..", "file", fileName); // تحديد الملف بناءً على المجلد الجذر
          fs.unlink(filePathToDelete, (err) => {
            if (err) {
              const error = appError.create(
                "wrong in the delete data",
                400,
                httpStatus.FAIL
              );
              return next(error);
            }
          });
          const error = appError.create(
            "this chapter is already exist",
            400,
            statusText.FAIL
          );
          return next(error);
        }
        const newaway = new chapterModel({
          name: name,
          extension: extension,
          totalParagraphs: paragraphs.length,
          paragraphs: numberedParagraphs,
        });
        await newaway.save();

        // ارسل النص المرقم والفقرة المحددة
        res.json({
          message: "The file has been uploaded successfully.",
          name: name,
          totalParagraphs: paragraphs.length,
          paragraphs: numberedParagraphs,
        });
      })
      .catch((err) => {
        const error = appError.create(
          "An error occurred while processing the file2",
          500,
          statusText.ERROR
        );
        return next(error);
      });
  });
};

module.exports = {
  addChapter,
  allChapter,
  //   chapter1,
  addChapterpdf,
  chapter,
};
