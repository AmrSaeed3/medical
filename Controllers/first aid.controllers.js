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
const moment = require("moment");
require("moment/locale/ar"); // تحديد لغة اللغة العربية

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
            // استخراج الحروف والأقواس , & , - , , ,
            const lettersOnly = cleanedLine.replace(
              /[^a-zA-Z0-9-*\s()&,]/g,
              ""
            );
            // إزالة العلامة '*' من النص
            const withoutAsterisk = lettersOnly.replace(/\*/g, "");
            //إزالة المسافة في بداية الجملة
            const cleanedSentence = withoutAsterisk
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
        if (missingImages.length > 0) {
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

  const absolutePath = path.resolve(__dirname, "..", folderdata, filePath );

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
        const numParagrphMissing = [];
        const dataMissing = [];
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
          if (numanswer == 0 || choose.length >= 5) {
            numParagrphMissing.push(paragraphNumber);
            dataMissing.push(question, choose, resultanswer, {
              countChoose: choose.length,
              numanswer: numanswer,
            });
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
        if (numParagrphMissing.length > 0) {
          return res.json({
            message: "The file has been uploaded Fail !",
            totalMissing: numParagrphMissing.length,
            missingParagraph: numParagrphMissing,
            dataMissing: dataMissing,
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
          totalMissing: numParagrphMissing.length,
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
const addchat = (req, res, next) => {
  const fileName = "nada2.txt";

  // قراءة محتوى الملف
  fs.readFile(fileName, "utf-8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err}`);
      return;
    }
    const messages = [];
    data.split("\n").map((line, index) => {
      let timestamp, sender, content, day;

      // التحقق من وجود العلامة ":" أو "-" في السطر
      if (line.includes(": ") && line.includes(" - ")) {
        const [timestamparabic, senderContent] = line.split(" - ");
        // التحقق مرة أخرى بعد التقسيم الأول
        const [currentSender, currentContent] = senderContent.split(": ");
        const alltimestamp = convertToEnglishFormat(timestamparabic);
        sender = currentSender;
        content = currentContent;
        const [currentDay, time, timing] = alltimestamp.split(" ");
        timestamp = time + " " + timing;
        day = currentDay;
      } else {
        // Initialize an empty array to store previous messages
        const prevMessage = messages[index - 1];
        // إذا لم يتم العثور على العلامات، يكون content هو السطر نفسه
        timestamp = prevMessage.timestamp;
        sender = prevMessage.sender;
        content = line;
        day = prevMessage.day;
      }

      messages.push({ timestamp, sender, content, day });
    });

    // تحويل التاريخ والوقت
    function convertToEnglishFormat(timestamp) {
      const formattedDate = moment(timestamp, "DD/MM/YYYY h:mm a")
        .locale("en")
        .format("DD/MM/YYYY hh:mm a");
      return formattedDate;
    }
    // تحويل المصفوفة إلى سلسلة نصية
    const messagesText = JSON.stringify(messages, null, 2);
    // المجلد الذي تريد حفظ الملف فيه
    const folderPath = "C:\\Users\\AMR\\Desktop\\New folder";

    // اسم الملف
    const fileName = "nada2.txt";

    // تكوين المسار الكامل للملف
    const filePath = path.join(folderPath, fileName);

    // حفظ الملف
    fs.writeFileSync(filePath, messagesText, "utf-8");

    return res.json(messages);
  });
};
module.exports = {
  addchat,
  addChapterword,
  addChapterpdf,
  allChapter,
  onechapter,
  addQuiz,
  allquiz,
  onequiz,
};
