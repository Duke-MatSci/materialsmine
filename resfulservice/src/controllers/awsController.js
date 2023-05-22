const S3Client = require('../s3client');
const { ListObjectsCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const csv = require('csvtojson');
const { errorWriter, successWriter } = require('../utils/logWriter');

const colorAssignment = [
  '#FFB347', '#8A8BD0', '#FFC0CB', '#6FA8DC', '#8FCE00', '#CC0000', '#38761D', '#9FC5E8', '#2f3b45', '#e8c29f'
];

exports.getAllDatasetNames = async (req, res, next) => {
  const { bucketName } = req.params; // 'ideal-dataset-1'
  const command = new ListObjectsCommand({
    Bucket: bucketName
  });
  const fetchedNames = [];
  try {
    await S3Client.send(command).then((res) => {
      if (res.length === 0) {
        return res.status(200).json({ fetchedNames });
      }
      const names = res.Contents.map(content => content.Key);
      for (let i = 0; i < names.length; i++) {
        fetchedNames.push({
          key: i, // key for antd table
          bucket_name: bucketName,
          name: names[i],
          color: colorAssignment[i]
        });
      }
    });
    successWriter(req, { message: 'success' }, 'getAllDatasetNames');
    return res.status(200).json({ fetchedNames });
  } catch (error) {
    next(errorWriter(req, 'error with list aws objects', 'getAllDatasetNames', 500));
  }
};

exports.fetchDatasets = async (req, res, next) => {
  const { bucketName, fileName } = req.params;
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName
  });
  try {
    const stream = (await S3Client.send(command)).Body;
    const data = await csv().fromStream(stream);
    return res.status(200).json({ fetchedData: data });
  } catch (error) {
    next(errorWriter(req, 'error with get aws csv object', 'fetchDatasets', 500));
  }
  successWriter(req, { message: 'success' }, 'fetchDatasets');
};
