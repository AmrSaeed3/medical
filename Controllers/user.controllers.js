const { user1, user2, user4, user8 } = require("../Models/user.models");
const fs = require("fs");
const appError = require("../utils/appError");
const httpStatus = require("../utils/httpStatus");
const asyncWrapper = require("../Middlewires/asyncWrapper");
const generateJwt = require("../utils/generate.jwt");
const { validationResult } = require("express-validator");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const mac = require("../Middlewires/mac");
const emailVerfy = require("../Middlewires/sendEmail");
const path = require("path");
const moment = require("moment-timezone");
const UserAll = user1;
const UserGoogle = user2;
const UserAnyone = user4;
const illnesses = user8;
// const
// استخدام مسار كامل لمجلد views خارج الملف الرئيسي
const viewsPath = path.join("E:\\programs\\NodeJs\\medical");

//register
const register = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = appError.create(errors.array()[0], 400, httpStatus.FAIL);
    return next(error);
  }
  const { userName, email, password, role } = req.body;
  const olduser = await UserAll.findOne({ email: email });
  if (olduser) {
    const error = appError.create("user already exists", 400, httpStatus.FAIL);
    return next(error);
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const verifyCode = await emailVerfy.sendEmail(email);
  const hashVerifyCode = await bcrypt.hash(JSON.stringify(verifyCode), 10);
  const token = await generateJwt.generate({
    email: email,
    userName: userName,
    role: role,
    verifyCode: hashVerifyCode,
    password: hashPassword,
    // id: uuid.v4(),
  });
  return res.status(200).json({
    status: httpStatus.SUCCESS,
    token: token.token,
    expireData: token.expireIn,
  });
  // const redirectUrl = `/verify?userName=${userName}&email=${email}&password=${password}&token=${token}`;
  // res.redirect(redirectUrl)
});

const verify = asyncWrapper(async (req, res, next) => {
  // الحصول على التاريخ والوقت الحالي
  const currentDate = moment().tz("Africa/Cairo");
  const { email, verifyCode, password, userName, role } = req.currentUser;
  const currentCode = verifyCode;
  const code = req.body.code;
  const matchedCode = await bcrypt.compare(code, currentCode);
  if (!matchedCode) {
    const error = appError.create(
      "the code verification not correct",
      400,
      httpStatus.FAIL
    );
    return next(error);
  }
  const oldEmail = await UserAll.findOne({ email: email });
  if (oldEmail) {
    const error = appError.create(
      "the email has been already registrated",
      400,
      httpStatus.FAIL
    );
    return next(error);
  }
  const newUser = new UserAll({
    userName,
    email,
    password,
    role,
    dateRegister: currentDate.format("DD-MMM-YYYY hh:mm:ss a"),
  });
  await newUser.save();
  res.json({ status: httpStatus.SUCCESS, data: { User: newUser } });
});
//login

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  const currentDate = moment().tz("Africa/Cairo");
  if (!errors.isEmpty()) {
    const error = appError.create(errors.array(), 400, httpStatus.FAIL);
    return next(error);
  }

  const user = await UserAll.findOne({ email: email });
  if (!user) {
    const error = appError.create("user not found", 400, httpStatus.FAIL);
    return next(error);
  }
  const matchedPassword = await bcrypt.compare(password, user.password);
  if (user && matchedPassword) {
    const token = await generateJwt.generateLogin({
      username: user.userName,
      email: user.email,
      id: user._id,
      role: user.role,
      avatar: user.avatar,
    });
    user.token = token.token;
    user.dateLogin = currentDate.format("DD-MMM-YYYY hh:mm:ss a");
    await user.save();
    res.json({
      status: httpStatus.SUCCESS,
      statusCode: 200,
      data: {
        id: user.id,
        username: user.userName,
        email: email,
        token: token.token,
        avatar: user.avatar,
        role: user.role,
        // dateLogin : currentDate.format("DD-MMM-YYYY hh:mm:ss a")
      },
    });
  } else if (user.password !== password) {
    const error = appError.create(
      "password is incorrect",
      400,
      httpStatus.FAIL
    );
    return next(error);
  } else {
    const error = appError.create("somthing wrong", 500, httpStatus.ERROR);
    return next(error);
  }
});
// مسار لإعادة تعيين كلمة المرور (نسيان الباسورد)

const oneuser = async (req, res, next) => {
  const id = req.params.id;
  const user = await user1.findById(id);
  if (!user) {
    const error = appError.create(
      "this user not found try again !",
      401,
      statusText.FAIL
    );
    return next(error);
  }  
  res.json({
    status: httpStatus.SUCCESS,
    statusCode: 200,
    data: {
      id: id,
      username: user.userName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

const anyone = asyncWrapper(async (req, res, next) => {
  const user = await UserAnyone.findOne({ mac: mac });
  const currentDate = moment().tz("Africa/Cairo");
  if (user) {
    const error = appError.create(
      "Oops , you can use SKIP FOR NOW just only once",
      500,
      httpStatus.ERROR
    );
    return next(error);
  }
  const token = await generateJwt.generatequicly({
    mac: mac,
  });
  const newUser = new UserAnyone({
    mac: mac,
    date: currentDate.format("DD-MMM-YYYY hh:mm:ss a"),
  });
  await newUser.save();
  res.json({
    status: httpStatus.SUCCESS,
    statusCode: 200,
      data: newUser,
      token: token.token,
      expireData: token.expireIn,
  });
});

const deleteanyone = asyncWrapper(async (req, res, next) => {
  const id = req.params.id;
  const user = await UserAnyone.findById(id);
  if (!user) {
    const error = appError.create(
      "not found this user !",
      400,
      httpStatus.FAIL
    );
    return next(error);
  }
  await UserAnyone.findByIdAndDelete(id);
  const error = appError.create(
    "this email has been deleted",
    200,
    httpStatus.SUCCESS
  );
  return next(error);
});

const forgotPassword = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = appError.create(errors.array()[0], 400, httpStatus.FAIL);
    return next(error);
  }
  const email = req.body.email;
  const user = await UserAll.findOne({ email: email });
  if (!user) {
    const error = appError.create(
      "not found this email !",
      400,
      httpStatus.FAIL
    );
    return next(error);
  }
  const verifyCode = await emailVerfy.sendEmail(email);
  const hashVerifyCode = await bcrypt.hash(JSON.stringify(verifyCode), 10);
  const token = await generateJwt.generate({
    email: email,
    id: user._id,
    role: user.role,
    verifyCode: hashVerifyCode,
    // id: uuid.v4(),
  });
  return res.status(200).json({
    status: httpStatus.SUCCESS,
    // data: newUser,
    token: token.token,
    expireData: token.expireIn,
  });
  // res.redirect(`/reset-password`)
});

const resetPasswordSend = asyncWrapper(async (req, res, next) => {
  const { email, verifyCode, role, id } = req.currentUser;
  const currentCode = verifyCode;
  const code = req.body.code;
  const matchedCode = await bcrypt.compare(code, currentCode);
  if (!matchedCode) {
    const error = appError.create(
      "the code verification not correct try again",
      400,
      httpStatus.FAIL
    );
    return next(error);
  }
  const token = await generateJwt.generate({
    email: email,
    role: role,
    id: id,
    // id: uuid.v4(),
  });
  return res.status(200).json({
    status: httpStatus.SUCCESS,
    token: token.token,
    expireData: token.expireIn,
  });
});
//
const resetPasswordOk = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = appError.create(errors.array()[0], 400, httpStatus.FAIL);
    return next(error);
  }
  const { email, role, id } = req.currentUser;
  const newPassword = req.body.newPassword;
  const newPassword2 = req.body.newPassword2;
  if (newPassword !== newPassword2) {
    const error = appError.create(
      "the password is not the same",
      400,
      httpStatus.FAIL
    );
    return next(error);
  }
  const hashPassword = await bcrypt.hash(newPassword, 10);
  const newUser = await UserAll.findOne({ email: email });
  newUser.password = hashPassword;
  await newUser.save();
  const error = appError.create(
    "the password has been reset successfully",
    200,
    httpStatus.SUCCESS
  );
  return next(error);
});

const deleteUser = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = appError.create(errors.array()[0], 400, httpStatus.FAIL);
    return next(error);
  }
  const email = req.body.email;
  const user = await UserAll.findOne({ email: email });
  if (!user) {
    const error = appError.create(
      "not found this email !",
      400,
      httpStatus.FAIL
    );
    return next(error);
  }
  await UserAll.deleteOne({ email: email });
  const error = appError.create(
    "this email has been deleted",
    200,
    httpStatus.SUCCESS
  );
  return next(error);
});

//
const addphoto = asyncWrapper(async (req, res, next) => {
  // الحصول على التاريخ والوقت الحالي
  // const currentDate = moment();
  const { explain, title } = req.body;
  const oldData = await illnesses.findOne({ title: title });
  if (oldData) {
    const fileName = req.file.filename; // اسم الملف الذي تريد حذفه
    const filePathToDelete = path.join(__dirname, "..", "uploads", fileName); // تحديد الملف بناءً على المجلد الجذر
    fs.unlink(filePathToDelete, (err) => {
      if (err) {
        const error = appError.create(
          "wrong in the delete photo",
          400,
          httpStatus.FAIL
        );
        return next(error);
      }
    });
    const error = appError.create("data already saved", 400, httpStatus.FAIL);
    return next(error);
  }
  const newData = new illnesses({
    title: title,
    avatar: req.file.filename,
    explain: explain,
    // date: currentDate.format("DD-MMM-YYYY hh:mm:ss a"),
  });
  await newData.save();
  res.json({ status: httpStatus.SUCCESS, data: newData });
});

const getAllData = asyncWrapper(async (req, res, next) => {
  const all = await illnesses.find({}, { __v: false, _id: false });
  if (all.length === 0) {
    const error = appError.create("data is Empty!", 200, httpStatus.SUCCESS);
    return next(error);
  }
  return res.json({ status: httpStatus.SUCCESS, data: all });
});

const getOneData = asyncWrapper(async (req, res, next) => {
  const title = req.params.title;
  const data = await illnesses.findOne(
    { title: title },
    { __v: false, _id: false }
  );
  if (!data) {
    const error = appError.create("data not found!", 404, httpStatus.FAIL);
    return next(error);
  }
  const currentUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    status: httpStatus.SUCCESS,
    data: data,
    CurrentURLPhoto: `${currentUrl}/uploads/${data.avatar}`,
  });
});

// لسه في تعديلات على avatar
const updateData = asyncWrapper(async (req, res) => {
  const updatedData = await illnesses.updateOne(
    { title: req.params.title },
    {
      $set: { ...req.body },
    }
  );
  return res.json({ status: httpStatus.SUCCESS, data: updatedData });
});

const deleteData = asyncWrapper(async (req, res, next) => {
  const data = await illnesses.findOne({ title: req.params.title });
  if (!data) {
    const error = appError.create(
      "this data not found !",
      404,
      httpStatus.FAIL
    );
    return next(error);
  }
  await illnesses.deleteOne({ title: req.params.title });
  const fileName = data.avatar; // اسم الملف الذي تريد حذفه
  const filePathToDelete = path.join(__dirname, "..", "uploads", fileName); // تحديد الملف بناءً على المجلد الجذر
  fs.unlink(filePathToDelete, (err) => {
    if (err) {
      const error = appError.create(
        "wrong in the delete photo",
        400,
        httpStatus.FAIL
      );
      return next(error);
    }
  });
  const error = appError.create("data is delete", 200, httpStatus.SUCCESS);
  return next(error);
});

const logout2 = (req, res) => {
  // req.logout((err) => {
  //   if (err) {
  //     return res
  //       .status(500)
  //       .json("Logout failed! " + req.flash("error"))
  //       .redirect("/"); // أو يمكنك التعامل مع الخطأ بطريقة أخرى
  //   }
  //   res.redirect("/");
  // });
  (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return res
          .status(500)
          .json({ status: "error", message: "Internal Server Error" });
      }
      res.redirect("/login");
    });
  };
};
const success = (req, res, next) => {
  const error = appError.create("Login successful!", 200, httpStatus.SUCCESS);
  return next(error);
};
const failure = (req, res, next) => {
  const result = req.flash("error");
  // res.status(401).json("Login failed! " + req.flash("error"));
  const error = appError.create(result[0], 401, httpStatus.FAIL);
  return next(error);
};
// const handleValidationErrors = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const error = appError.create(errors.array()[0], 400, httpStatus.FAIL);
//     return next(error);
//   }
//   next();
// };

const logout = async (req, res) => {
  if (req.isAuthenticated()) {
    const { email } = req.user;

    // توفير وظيفة callback
    req.logout(() => {
      // حذف البريد الإلكتروني من قاعدة البيانات
      UserGoogle.findOneAndDelete({ email })
        .then(() => {
          // حذف الكوكيز معرف المستخدم
          res.clearCookie("userId");
          res.clearCookie("sessionToken");
          res.redirect("/");
        })
        .catch((err) => {
          console.error("Error deleting user:", err);
          res.redirect("/");
        });
    });

    return;
  }

  // إذا لم يكن المستخدم قد قام بتسجيل الدخول، قم بتوجيهه إلى الصفحة الرئيسية أو أي مكان آخر
  res.redirect("/");
};

const authGoogle = (req, res) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res);
};

module.exports = {
  //getAllUsers,
  // authGoogleCallback,
  // upload,
  deleteanyone,
  oneuser,
  deleteData,
  updateData,
  getOneData,
  getAllData,
  addphoto,
  deleteUser,
  verify,
  anyone,
  // handleValidationErrors,
  forgotPassword,
  resetPasswordSend,
  resetPasswordOk,
  authGoogle,
  register,
  logout,
  logout2,
  success,
  failure,
  login,
};
