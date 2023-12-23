const jwt = require("jsonwebtoken");
const httpStatusTex = require("../utils/httpStatus");
const appError = require("../utils/appError");
// require("dotenv").config();
// const privateKey = process.env.JWT_SELECT_KEY;
const privateKey =
  "f39f5593fdb3a7c4a4fa8d06ab6d6506fba6eaa5a94139048629cf0a36f6bae8";
const verifyToken = (req, res, next) => {
  const authHeader =
    req.headers["Authorization"] || req.headers["authorization"];
  if (!authHeader) {
    const error = appError.create(
      // " رمز إعادة تعيين كلمة المرور غير صالح",
      // "the page code is invalid",
      "الوصول غير مسموح.",
      401,
      httpStatusTex.ERROR
    );
    return next(error);
  }
  const token = authHeader.split(" ")[1];
  try {
    const currentUser = jwt.verify(token, privateKey);
    req.currentUser = currentUser;
    next();
  } catch (err) {
    const error = appError.create(
      // "انتهت صلاحية طلب إعادة تعيين كلمة المرور",
      "the request has expired",
      401,
      httpStatusTex.ERROR
    );
    return next(error);
  }
};

module.exports = verifyToken;
