const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const {user1,user2,user6} = require("../Models/user.models");
const LocalUser = user1;
const appError = require("../utils/appError");
const httpStatus = require("../utils/httpStatus");
const passport = require("passport");
//
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GoogleUser = user2;
const FacebookStrategy = require("passport-facebook").Strategy;
const FaceBookUser = user6;
const config = require("../config/config");

module.exports = () => {
  passport.use(
    new LocalStrategy(
      { usernameField: "email" }, // تحديد حقل البريد الإلكتروني
      async (email, password, done) => {
        const user = await LocalUser.findOne({ email: email });
        if (!user) {
          const error = appError.create("user not found", 400, httpStatus.FAIL);
          return done(null, false, error);
        }
        const matchedPassword = await bcrypt.compare(password, user.password);
        if (!matchedPassword) {
          return done(null, false, { message: "Incorrect password." });
        } else if (user && matchedPassword) {
          return done(null, user);
        }
        // else {
        //   return done(err);
        // }
      }
    )
  );
  passport.use(
    new GoogleStrategy(
      config.google,
      async (token, tokenSecret, profile, done) => {
        const userData = {
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
        };

        try {
          let user = await GoogleUser.findOne({ googleId: profile.id });

          if (!user) {
            user = await GoogleUser.create(userData);
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  passport.use(
    new FacebookStrategy(
      config.facebook,
      async (accessToken, refreshToken, profile, done) => {
        const userData = {
          facebookId: profile.id,
          displayName: profile.displayName,
          // email: profile.emails,
          // token:token,
        };
        try {
          let user = await FaceBookUser.findOne({ facebookId: profile.id });

          if (!user) {
            user = await FaceBookUser.create(userData);
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
        //   return done(null, profile);
      }
    )
  );
  passport.serializeUser((user, done) => {
    const userObject = {
      id: user.id,
      type:
        user instanceof LocalUser
          ? "local"
          : user instanceof GoogleUser
          ? "google"
          : user instanceof FaceBookUser
          ? "facebook"
          : "unknown", // يمكنك استخدام معرف تمييزي لمعرفة نوع المستخدم
    };
    done(null, userObject);
  });

  passport.deserializeUser(async (userObject, done) => {
    try {
      if (userObject.type === "local") {
        const user = await LocalUser.findById(userObject.id);
        done(null, user);
      } else if (userObject.type === "google") {
        // قم بتنفيذ الاسترجاع من قاعدة البيانات لمستخدم Google
        const user = await GoogleUser.findById(userObject.id);
        done(null, user);
      } else if (userObject.type === "facebook") {
        // قم بتنفيذ الاسترجاع من قاعدة البيانات لمستخدم Google
        const user = await FaceBookUser.findById(userObject.id);
        done(null, user);
      } else {
        done(new Error("Invalid user type"));
      }
    } catch (error) {
      done(error);
    }
  });
};
// const isAuthenticated = (req, res, next) => {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.status(401).json({ message: 'غير مصرح' });
// };
// // مسار API محمي بواسطة Passport-local
// router.get('/user', isAuthenticated, (req, res) => {
//   // إذا وصلت إلى هنا، فهذا يعني أن المستخدم مصادق
//   res.json({ user: req.user });
// });
