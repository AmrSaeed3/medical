const express = require('express');
const bodyParser = require('body-parser');
const { passport, generateJwt } = require('./config/config2');
const mongoose = require('mongoose');
const User = require('./Models/user.models'); // تأكد من تعيين المسار الصحيح
const app = express();

require("dotenv").config();
const utl = process.env.MONGO_URL;
mongoose.connect(utl).then(() => {
  console.log("mongoDB server start");
});
// Middlewares
app.use(bodyParser.json());
app.use(passport.initialize());

// Routes
app.post('/login3', async (req, res) => {
  try {
    const { macAddress } = req.body;

    // قم بإنشاء المستخدم في قاعدة البيانات إذا كان جديدًا
    let user = await User.user7.findOne({ macAddress :macAddress});
    if (!user) {
      user = new User.user7({ macAddress :macAddress });
      await user.save();
    }

    // قم بتوليد رمز JWT وإرساله للعميل
    const token = generateJwt(macAddress);
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// مسار محمي يتطلب الرمز المميز للوصول
app.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({ message: 'مرحبًا بك في المسار المحمي!' });
});

// تشغيل الخادم
const port = 3000;
app.listen(process.env.PORT || port, () => {
  console.log(`example app listening on port ${process.env.PORT || port}`);
});
