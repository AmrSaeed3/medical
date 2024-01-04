const mongoose = require("mongoose");
const validator = require("validator");
const userRole = require("../utils/userRoles");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    require: [true, "user name are required"],
  },
  email: {
    type: String,
    require: [true, "email are required"],
    unique: true,
    validate: [validator.isEmail, "filed must be a valid email address"],
  },
  password: {
    type: String,
    require: [true, "email are required"],
  },
  role: {
    type: String, //["USER" , "ADMIN" , "MANGER"]
    enum: [userRole.USER, userRole.ADMIN, userRole.MANGER],
    default: userRole.USER,
  },
  date:{
    type: String,
    require: [true, "date are required"],
  },
  
});
const userSchema2 = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
});
const userSchema4 = new mongoose.Schema({
  mac: String,
});
const userSchema6 = new mongoose.Schema({
  facebookId: String,
  displayName: String,
  // email: String,
  // token:String,
});
const userSchema7 = new mongoose.Schema({
  macAddress: { type: String, required: true, unique: true },
});
const userSchema3 = new mongoose.Schema({
  token:String
}) 
const user1 = mongoose.model("User", userSchema);
const user2 = mongoose.model("UserGoogle", userSchema2);
const user3 = mongoose.model("UserToken", userSchema3);
const user4 = mongoose.model("UserAnyone", userSchema4);
const user6 = mongoose.model("UserFaceBook", userSchema6);
const user7 = mongoose.model('UserJWT', userSchema7);
module.exports = {
  user1,
  user2,
  user3,
  user4,
  user6,
  user7,
};
