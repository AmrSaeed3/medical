const mongoose = require("mongoose");
const validator = require("validator");
const userRole = require("../utils/userRoles");
// محتاجه صيانه
const User = new mongoose.Schema({
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
  date: {
    type: String,
    require: [true, "date are required"],
  },
  avatar: {
    type: String,
    default: "uploads/profile.png",
  },
});
const UserGoogle = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
});
const UserToken = new mongoose.Schema({
  token: String,
});
const UserAnyone = new mongoose.Schema({
  mac: String,
});
const UserFaceBook = new mongoose.Schema({
  facebookId: String,
  displayName: String,
  // email: String,
  // token:String,
});
const UserJWT = new mongoose.Schema({
  macAddress: { type: String, required: true, unique: true },
});
const illnesses = new mongoose.Schema({
  title:String,
  avatar: String,
  explain: String,
});
const user1 = mongoose.model("User", User);
const user2 = mongoose.model("UserGoogle", UserGoogle);
const user3 = mongoose.model("UserToken", UserToken);
const user4 = mongoose.model("UserAnyone", UserAnyone);
const user6 = mongoose.model("UserFaceBook", UserFaceBook);
const user7 = mongoose.model("UserJWT", UserJWT);
const user8 = mongoose.model("illnesses" , illnesses)
module.exports = {
  user1,
  user2,
  user3,
  user4,
  user6,
  user7,
  user8,
};
