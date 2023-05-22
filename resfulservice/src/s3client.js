
const { S3Client } = require('@aws-sdk/client-s3');

// const s3Client = new S3Client({
//   region: process.env.AWS_S3_REGION || 'us-east-2',
//   credentials: {
//     accessKeyId: process.env.AWS_S3_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_S3_SECRET_KEY,
//   },
// });

const s3Client = new S3Client({
  region: 'us-east-2',
  credentials: {
    accessKeyId: 'AKIAZCLM5UPU5OGMXMKI',
    secretAccessKey: '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'
  }
});

module.exports = s3Client;
