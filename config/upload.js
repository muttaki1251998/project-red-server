const dotenv = require('dotenv');
dotenv.config();

const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const path = require('path');


// Configure AWS SDK v3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer S3 storage configuration
const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET,
  key: function (req, file, cb) {
    const frontendId = req.headers['x-frontend-id'];
    const uploadPath = `${frontendId}/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uploadPath);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|svg|webp|mp4|avi|mov|mkv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images and Videos Only!'));
    }
  }
});

module.exports = upload;
