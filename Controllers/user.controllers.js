const User = require("../Models/user.models");
const appError = require("../utils/appError");
const httpStatus = require("../utils/httpStatus");
const asyncWrapper = require("../Middlewires/asyncWrapper");
const generateJwt = require("../utils/generate.jwt");
const { validationResult } = require("express-validator");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const mac = require("../Middlewires/mac");
const emailVerfy = require("../Middlewires/sendEmail");
// const uuid = require('uuid');
//

//getAllUsers
//register

const register = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = appError.create(errors.array(), 400, httpStatus.FAIL);
    return next(error);
  }
  const { userName, email, password, role } = req.body;
  const olduser = await User.user1.findOne({ email: email });
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
  const { email, verifyCode, password, userName, role } = req.currentUser;
  const currentCode = verifyCode;
  const code = req.body.code;
  const matchedCode = await bcrypt.compare(code ,currentCode);
  if (!matchedCode) {
    const error = appError.create(
      "the code verification not correct",
      400,
      httpStatus.FAIL
    );
    return next(error);
  }
  const oldEmail =await User.user1.findOne({email:email})
  if(oldEmail){
    const error = appError.create(
      "the email has been already registrated",
      400,
      httpStatus.FAIL
    );
    return next(error);
  }
  const newUser = new User.user1({
    userName,
    email,
    password,
    role,
  });
  await newUser.save();
  res.json({ status: httpStatus.SUCCESS, data: { User: newUser } });
});
//login
const login2 = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = appError.create(errors.array(), 400, httpStatus.FAIL);
    return next(error);
  }

  const user = await User.user1.findOne({ email: email });
  if (!user) {
    const error = appError.create("user not found", 400, httpStatus.FAIL);
    return next(error);
  }
  const matchedPassword = await bcrypt.compare(password, user.password);
  if (user && matchedPassword) {
    const token = await generateJwt.generate({
      email: user.email,
      id: user._id,
      role: user.role,
    });
    user.token = token.token;
    await user.save();
    res.json({
      status: httpStatus.SUCCESS,
      data: { token: token.token },
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
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = appError.create(errors.array()[0], 400, httpStatus.FAIL);
    return next(error);
  }
  next();
};
const logout = async (req, res) => {
  if (req.isAuthenticated()) {
    const { email } = req.user;

    // توفير وظيفة callback
    req.logout(() => {
      // حذف البريد الإلكتروني من قاعدة البيانات
      User.user2
        .findOneAndDelete({ email })
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
const homePage = (req, res) => {
  res.send(
    req.isAuthenticated()
      ? `Hello, ${req.user.displayName}! <a href="/logout">Logout</a>`
      : 'Welcome! <a href="/auth/google">Login with Google</a>'
  );
};
const authGoogle = (req, res) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res);
};
const login = (req, res) => {
  passport.authenticate("local", {
    successRedirect: "/success",
    failureRedirect: "/failure",
    failureFlash: true,
  })(req, res);
};

// مسار لإعادة تعيين كلمة المرور (نسيان الباسورد)

const forgotPassword = asyncWrapper(async (req, res, next) => {
  const email = req.body.email;
  const user = await User.user1.findOne({ email: email });
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
  const newUser = await User.user1.findOne({ email: email });
  newUser.password = hashPassword;
  await newUser.save();
  const error = appError.create(
    "the password has been reset successfully",
    200,
    httpStatus.SUCCESS
  );
  return next(error);
});
const anyone = asyncWrapper(async (req, res, next) => {
  const user = await User.user4.findOne({ mac: mac });
  if(user){
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
    const newUser = new User.user4({
      mac: mac,
    });
    await newUser.save();
    res.status(200).json({ status: httpStatus.SUCCESS, data: newUser,token:token.token, expireData:token.expireIn });
    // setTimeout(() => {
    //   res.redirect('/success')
    // }, token.expireData);
});

module.exports = {
  //getAllUsers,
  // authGoogleCallback,
  verify,
  anyone,
  handleValidationErrors,
  forgotPassword,
  resetPasswordSend,
  resetPasswordOk,
  authGoogle,
  homePage,
  register,
  login,
  logout,
  logout2,
  success,
  failure,
  login2,
};
