const Minio = require('minio');
const { MinioBucket, MetamineBucket } = require('../../config/constant');
const env = process.env;

const minioClient = new Minio.Client({
  endPoint: 'minio',
  port: parseInt(env.MINIO_PORT),
  useSSL: false,
  accessKey: env.MINIO_ROOT_USER,
  secretKey: env.MINIO_ROOT_PASSWORD
});

const connectMinio = (bucketName) => {
  const minioBucket = bucketName ?? env.MINIO_BUCKET ?? MinioBucket;
  minioClient.bucketExists(minioBucket, function (err, exists) {
    if (err) {
      return console.log(err);
    }
    if (exists) {
      return console.log('Bucket exists.');
    } else {
      minioClient.makeBucket(minioBucket, 'us-east-1', function (err) {
        if (err) return console.log(err);

        console.log('Bucket created successfully in "us-east-1".');
      });
    }
  });
};

connectMinio();
connectMinio(MetamineBucket);

module.exports = minioClient;
