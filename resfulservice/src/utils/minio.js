const Minio = require('minio');
const { MinioBucket } = require('../../config/constant');
const env = process.env;

const minioClient = new Minio.Client({
  endPoint: 'minio',
  port: parseInt(env.MINIO_PORT),
  useSSL: false,
  accessKey: env.MINIO_ROOT_USER,
  secretKey: env.MINIO_ROOT_PASSWORD
});

minioClient.bucketExists(env.MINIO_BUCKET ?? MinioBucket, function (err, exists) {
  if (err) {
    return console.log(err);
  }
  if (exists) {
    return console.log('Bucket exists.');
  } else {
    minioClient.makeBucket(env.MINIO_BUCKET ?? MinioBucket, 'us-east-1', function (err) {
      if (err) return console.log(err);

      console.log('Bucket created successfully in "us-east-1".');
    });
  }
});

module.exports = minioClient;
