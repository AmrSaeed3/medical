const { body } = require("express-validator");

const validationSchema = () => {
  return [
    body("userName")
      .notEmpty()
      .withMessage("user name is required")
      .isLength({ min: 3 })
      .withMessage("user name at least is 3 digits"),
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("email is not avalid"),
    body("password")
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 4 })
      .withMessage("password at least is 4 digits"),
  ];
};
const validationSchema2 = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("email is not avalid"),
    body("password")
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 4 })
      .withMessage(" password at least is 4 digits"),
  ];
};
const validationSchema3 = () => {
  return [
    body("newPassword")
      .notEmpty()
      .withMessage("newPassword is required")
      .isLength({ min: 4 })
      .withMessage("newPassword at least is 4 digits"),
    body("newPassword2")
      .notEmpty()
      .withMessage("newPassword is required")
      .isLength({ min: 4 })
      .withMessage("newPassword at least is 4 digits"),
  ];
};

const validationSchema4 = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("email is not avalid"),
  ];
};
module.exports = {
  validationSchema,
  validationSchema2,
  validationSchema3,
  validationSchema4,
};
