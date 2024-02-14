const { data1, data2, data3 } = require("../Models/firs aid.models");
const mammoth = require("mammoth");
const pdf = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const appError = require("../utils/appError");
const statusText = require("../utils/httpStatus");
const chapterModel = data1;
const Image = data2;
const Quiz = data3;
const folderdata = "file";
const folderphoto = "uploads";

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

  const absolutePath = path.resolve(__dirname, "..", folderdata, filePath);

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
        const arrayPhotos = [];
        const paragraphs = result.value.split(paragraphMarker);
        // إضافة ترقيم لكل فقرة
        const numberedParagraphs = paragraphs.map((paragraph, index) => {
          const paragraphNumber = index + 1;
          const lines = paragraph.split("\n");
          const filteredArray = lines.filter((value) => value.trim() !== "");
          const firstLine = filteredArray[0].trim();

          function extractLetters(sentence) {
            // إزالة الترقيم المحددة
            const cleanedLine = sentence.replace(
              /(?:^|\n)\s*[➢a-zA-Z\d]\s*-\s*|\d+-\s*|\(\w\)-\s*/g,
              ""
            );
            // استخراج الحروف والأقواس
            const lettersOnly = cleanedLine.replace(/[^a-zA-Z\s()]/g, "");
            //إزالة المسافة في بداية الجملة
            const cleanedSentence = lettersOnly
              .replace(/^\s+/, "")
              .replace(/\s+$/, "");
            return cleanedSentence;
          }

          const result = extractLetters(firstLine);
          const currentPhoto = `${result}.png`;
          // حفظ كل currentPhoto في مصفوفة
          arrayPhotos.push(currentPhoto);
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
          const filePathToDelete = path.join(
            __dirname,
            "..",
            folderdata,
            fileName
          ); // تحديد الملف بناءً على المجلد الجذر
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
        if (arrayPhotos) {
          // فحص وجود الصور في مجلد uploads
          const missingImages = arrayPhotos.filter((arrayPhotos) => {
            const imagePath = path.join(
              __dirname,
              "..",
              folderphoto,
              name,
              arrayPhotos
            ); // استبدل 'uploads' بالمسار الصحيح لمجلد الرفع الخاص بك
            return !fs.existsSync(imagePath);
          });
          // الآن `missingImages` يحتوي على أسماء الصور التي غير موجودة في مجلد uploads
          return res.json({
            message: "FAIL !, images not found in folder",
            totalMissing: missingImages.length,
            data: missingImages,
          });
        }
        const newaway = new chapterModel({
          name: name,
          extension: extension,
          totalParagraphs: paragraphs.length,
          paragraphs: numberedParagraphs,
        });
        await newaway.save();

        const image = new Image({
          name: name,
          extension: extension,
          totalImages: paragraphs.length,
          arrayPhotos: arrayPhotos,
        });
        await image.save();

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

  const absolutePath = path.resolve(__dirname, "..", folderdata, filePath);
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
        const arrayPhotos = [];
        // استخدام fs.promises.readdir للحصول على جميع الملفات في المجلد
        const files = await fs.promises.readdir(
          path.join(__dirname, "..", folderphoto, name)
        );
        const paragraphs = result.text.split(paragraphMarker);
        // إضافة ترقيم لكل فقرة
        const numberedParagraphs = paragraphs.map((paragraph, index) => {
          const paragraphNumber = index + 1;
          const lines = paragraph.split("\n");
          const filteredArray = lines.filter((value) => value.trim() !== "");
          const firstLine = filteredArray[0].trim();

          function extractLetters(sentence) {
            // إزالة الترقيم المحددة
            const cleanedLine = sentence.replace(
              /(?:^|\n)\s*[➢a-zA-Z\d]\s*-\s*|\d+-\s*|\(\w\)-\s*/g,
              ""
            );
            // استخراج الحروف والأقواس
            const lettersOnly = cleanedLine.replace(/[^a-zA-Z\s()]/g, "");
            //إزالة المسافة في بداية الجملة
            const cleanedSentence = lettersOnly
              .replace(/^\s+/, "")
              .replace(/\s+$/, "");
            return cleanedSentence;
          }

          const result = extractLetters(firstLine);
          const currentPhoto = `${result}.png`;
          // حفظ كل currentPhoto في مصفوفة
          arrayPhotos.push(currentPhoto);
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
          const filePathToDelete = path.join(
            __dirname,
            "..",
            folderdata,
            fileName
          ); // تحديد الملف بناءً على المجلد الجذر
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
        if (arrayPhotos) {
          // فحص وجود الصور في مجلد uploads
          const missingImages = arrayPhotos.filter((arrayPhoto) => {
            // استخراج اسم الملف بدون الامتداد
            const imagePath = path.join(
              __dirname,
              "..",
              folderphoto,
              name,
              arrayPhoto
            ); // استبدل 'uploads' بالمسار الصحيح لمجلد الرفع الخاص بك
            return !fs.existsSync(imagePath);
          });
          // الآن `missingImages` يحتوي على أسماء الصور التي غير موجودة في مجلد uploads
          return res.json({
            message: "FAIL !, images not found in folder",
            totalMissing: missingImages.length,
            data: missingImages,
          });
        }
        const newaway = new chapterModel({
          name: name,
          extension: extension,
          totalParagraphs: paragraphs.length,
          paragraphs: numberedParagraphs,
        });
        // await newaway.save();

        const image = new Image({
          name: name,
          extension: extension,
          totalImages: paragraphs.length,
          arrayPhotos: arrayPhotos,
        });
        // await image.save();

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

const allChapter = async (req, res, next) => {
  const name = req.params.name;
  const currentPhoto = `${req.protocol}://${req.get(
    "host"
  )}/${folderphoto}/${name}`;
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

const onechapter = async (req, res, next) => {
  const numbers = req.params.num;
  const name = req.params.name;
  const chapter = await chapterModel.findOne({ name: name });
  const currentPhoto = `${req.protocol}://${req.get(
    "host"
  )}/${folderphoto}/${name}`;
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

  const absolutePath = path.resolve(__dirname, "..", folderdata, filePath);

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
        const count = [];
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
          function extractLetters(sentence) {
            //إزالة المسافة في بداية الجملة
            const cleanedSentence = sentence
              .replace(/^\s+/, "")
              .replace(/\s+$/, "");
            return cleanedSentence;
          }

          const resultanswer = extractLetters(answer);
          const numanswer = choose.indexOf(resultanswer) + 1;
          if (numanswer == 0) {
            count.push(paragraphNumber);
          }
          return {
            pageNumber: paragraphNumber,
            question: question,
            choose: choose,
            answer: answer,
            numanswer: numanswer,
          };
        });
        const chapter = await Quiz.findOne({ name: name });
        if (chapter) {
          const fileName = req.file.filename; // اسم الملف الذي تريد حذفه
          const filePathToDelete = path.join(
            __dirname,
            "..",
            folderdata,
            fileName
          ); // تحديد الملف بناءً على المجلد الجذر
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
        if (count > 0) {
          return res.json({
            message: "The file has been uploaded Fail !",
            missingParagraph: count,
            totalMissing: count.length,
            // paragraphs: numberedParagraphs,
          });
        }
        const newaway = new Quiz({
          name: name,
          extension: extension,
          totalParagraphs: paragraphs.length,
          paragraphs: numberedParagraphs,
        });
        await newaway.save();

        // ارسل النص المرقم والفقرة المحددة
        res.json({
          message: "The file has been uploaded successfully.",
          totalMissing: count.length,
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
const allquiz = async (req, res, next) => {
  const name = req.params.name;
  const oldquiz = await Quiz.findOne(
    { name: name },
    { _id: false, extension: false }
  );
  if (!oldquiz) {
    const error = appError.create("this quiz is found !", 400, statusText.FAIL);
    return next(error);
  }
  return res.json({ data: oldquiz });
};
const onequiz = async (req, res, next) => {
  const numbers = req.params.num;
  const name = req.params.name;
  const chapter = await Quiz.findOne({ name: name });
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
module.exports = {
  addChapterword,
  addChapterpdf,
  allChapter,
  onechapter,
  addQuiz,
  allquiz,
  onequiz,
};
