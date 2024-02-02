const { user1 } = require("../Models/firs aid.models");
const mammoth = require("mammoth");
const pdf = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const appError = require("../utils/appError");
const statusText = require("../utils/httpStatus");
const chapterModel = user1;

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
const addChapterword = async (req, res, next) => {
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
          const filteredArray = lines.filter((value) => value.trim() !== "");
          const firstLine = filteredArray[0].trim();

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
        // await newaway.save();

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
          const filteredArray = lines.filter((value) => value.trim() !== "");
          const firstLine = filteredArray[0].trim();

          function extractLetters(sentence) {
            // إزالة أي ترقيم من بداية السطر
            const cleanedLine = sentence.replace(/^\(\w\)-\s*/, "");
            console.log(cleanedLine);
            // استخراج الحروف فقط
            const lettersOnly = cleanedLine.replace(/[^a-zA-Z\s]/g, "");
            //إزالة المسافة في بداية الجملة
            const cleanedSentence = lettersOnly
              .replace(/^\s+/, "")
              .replace(/\s+$/, "");
            return cleanedSentence;
          }

          const result = extractLetters(firstLine);
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
        // await newaway.save();

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
const addQuiz = async (req, res, next) => {
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
          const filteredArray = lines.filter((value) => value.trim() !== "");
          const question = filteredArray[0].trim();
          const answer = filteredArray.pop();
          const choose = filteredArray.filter(
            (value) => value.trim() !== question
          );
          return {
            pageNumber: paragraphNumber,
            question: question,
            choose: choose,
            answer: answer,
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
        // await newaway.save();

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

module.exports = {
  addChapterword,
  allChapter,
  addChapterpdf,
  addQuiz,
  chapter,
};
