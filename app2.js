const fs = require("fs");
const { Octokit } = require("@octokit/rest");

// تعيين اسم الملف والمستودع
const fileName = "my_image.jpg";
const repoOwner = "YOUR_GITHUB_USERNAME";
const repoName = "YOUR_REPO_NAME";

// تحديد مسار الملف في المستودع
const filePathInRepo = `images/${fileName}`;

// قراءة محتوى الملف
const fileContent = fs.readFileSync(fileName);

// تكوين الاتصال بـ GitHub API
const octokit = new Octokit({
  auth: "YOUR_GITHUB_TOKEN", // قم بتعيين رمز الوصول الشخصي الخاص بك هنا
});

// رفع الملف إلى المستودع
octokit.repos
  .createOrUpdateFileContents({
    owner: repoOwner,
    repo: repoName,
    path: filePathInRepo,
    message: "إضافة صورة جديدة",
    content: fileContent.toString("base64"),
  })
  .then((response) => {
    console.log("تم رفع الصورة بنجاح:", response.data.content);
  })
  .catch((error) => {
    console.error("حدث خطأ أثناء رفع الصورة:", error.message);
  });
