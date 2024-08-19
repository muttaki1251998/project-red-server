const express = require('express');
const router = express.Router();
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config();

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Middleware to check for headers
const checkHeaders = (req, res, next) => {
  const frontendId = req.headers['x-frontend-id'];
  if (!frontendId) {
    console.log('Frontend identifier is required'); // Log missing frontend ID
    return res.status(400).send('Frontend identifier is required');
  }
  req.frontendId = frontendId; // Save frontendId for later use
  next();
};

router.get('/images/uploads/:frontendId/:filename', checkHeaders, async (req, res) => {
  const { filename, frontendId } = req.params;

  const bucketName = process.env.AWS_S3_BUCKET;
  const key = `${frontendId}/${filename}`;

  console.log(`Frontend ID: ${frontendId}`);
  console.log(`Looking for file: ${key}`); // Log the file path

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const data = await s3.send(command);

    res.setHeader('Content-Type', data.ContentType);
    data.Body.pipe(res);
  } catch (error) {
    console.log(`File not found: ${key}`, error); // Log if file is not found
    res.status(404).send('Image not found');
  }
});

module.exports = router;
