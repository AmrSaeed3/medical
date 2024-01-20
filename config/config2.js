//config2
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');

const secretKey = 'your-secret-key';
const {user7} = require('../Models/user.models'); // تأكد من تعيين المسار الصحيح

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secretKey,
}, async (payload, done) => {
  try {
    const user = await user7.findOne({ macAddress: payload.macAddress });
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));

function generateJwt(macAddress) {
  const payload = {
    macAddress,
  };

  return jwt.sign(payload, secretKey, { expiresIn: '2 m' });
}

module.exports = {
  passport,
  generateJwt,
};
