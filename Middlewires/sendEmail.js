const nodemailer = require("nodemailer");
const generateRandomNumber = require("../utils/generateNumber");
require("dotenv").config();
const sendEmail = (email) => {
  // const { subject, recipient } = req.body;
  // استخدام الدالة للحصول على رقم
    return new Promise((resolve, reject) => {
  const sixDigitInteger = generateRandomNumber(6);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL, // اسم مستخدم حساب Gmail
      pass: process.env.PASSWORD_EMAIL, // كلمة مرور حساب Gmail
    },
  });
  // إعداد الرسالة
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: email, // بريد المستلم
    subject: "تأكيد الحساب",
    text: sixDigitInteger.toString(),
  };
  // إرسال الرسالة
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        // reject (res.status(500).send("error sending email"));
        reject ("error sending email");
    //   } else {
    //     // console.log("email sent " + info.response);
    //     // res.status(200).send("email sent successfully");
    //     resolve(sixDigitInteger)
      }
    });
    resolve(sixDigitInteger)
  });
};
module.exports = {sendEmail};
