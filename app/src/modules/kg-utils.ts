import { FileItem } from '@/types/app';
import { deleteFile, parseFileName, saveDatasetFiles } from './whyis-dataset';
import { querySparql } from './sparql';
import { lodPrefix } from './whyis-utils';

interface MetaData {
  did: string;
  doi?: string;
  externalSddLink?: string;
  title: string;
  description: string;
  datePub: any;
  organizations: any;
  contactPoint: any;
}

async function saveSDDDataset(
  fileList: FileItem[],
  imageList: FileItem[],
  metaData: MetaData
): Promise<any> {
  const npId = `${lodPrefix}/explorer/dataset/${metaData.did}`;
  const resId = `${lodPrefix}/resource/pnc/${metaData.did}`;
  const oldFiles = fileList.filter((file) => file.status === 'complete');
  const oldDepiction = imageList.filter((file) => file.status === 'complete');
  const imgToDelete = imageList.filter((file) => file.status === 'delete')?.[0]?.accessUrl;
  let imgDeleteId: string | undefined;
  if (imgToDelete) imgDeleteId = parseFileName(imgToDelete, true);

  const [distrRes, imgRes] = await Promise.all([
    saveDatasetFiles(fileList.filter((file) => file.status === 'incomplete')),
    saveDatasetFiles(imageList.filter((file) => file.status === 'incomplete')),
    deleteFile(imgDeleteId),
  ]);

  let allFiles = [...oldFiles];
  if (distrRes?.files) allFiles = [...allFiles, ...distrRes.files];
  if (metaData.externalSddLink) {
    allFiles.push({
      uri: metaData.externalSddLink,
      name: parseFileName(metaData.externalSddLink),
      status: 'complete',
    });
  }

  const nanopubSkeleton = { id: npId, distribution: null, depiction: null, ...metaData };
  if (allFiles?.length) {
    nanopubSkeleton.distribution = buildDistrLd(allFiles, resId);
  }

  if (imgRes?.files?.length) {
    nanopubSkeleton.depiction = buildDepictionLd(imgRes?.files?.[0], resId);
  } else if (oldDepiction.length) {
    nanopubSkeleton.depiction = buildDepictionLd(oldDepiction[0], resId);
  }

  try {
    const response = await querySparql('', {
      endpoint: '/api/curate/publishsdd',
      body: { nanopubSkeleton },
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (err) {
    const uploadedFiles: FileItem[] = [];
    if (distrRes?.files) uploadedFiles.push(...distrRes.files);
    if (imgRes?.files) uploadedFiles.push(...imgRes.files);

    await Promise.allSettled(
      uploadedFiles.map((file) => {
        const fileId = parseFileName(file.filename || '', true);
        return deleteFile(fileId);
      })
    );

    throw err;
  }
}

function buildDistrLd(fileList: FileItem[], uri: string): any {
  const distrLDs: any[] = [];
  Array.from(Array(fileList.length).keys()).map((x) => {
    const fileName = fileList[x]?.swaggerFilename ?? fileList[x]?.name;
    distrLDs.push({
      '@id':
        fileList[x]?.status === 'complete'
          ? fileList[x].uri
          : `${window.location.origin}${fileList[x].filename}`,
      'rdfs:label': fileName,
    });
  });

  return {
    'mm:hasDistribution': {
      '@id': `${uri}/attr/distribution`,
      'dcat:distribution': distrLDs,
    },
  };
}

function buildDepictionLd(file: FileItem, uri: string): any {
  return {
    'mm:hasDepiction': {
      '@id': `${uri}/attr/depiction`,
      'foaf:depiction': [
        {
          '@id': `${uri}/attr/depiction/file`,
          '@type': 'purl:File',
          'rdfs:label': file?.swaggerFilename ?? file.originalname,
          'dcat:accessURL': file?.accessUrl ?? `${window.location.origin}${file.filename}`,
        },
      ],
    },
  };
}

const prodFailingCharts = [
  '9316ed4a6947cebb',
  '311448fc489b3031',
  '4911511ccfc19ee0',
  '5b766ace33d64a23',
  '95fabe36a3695b21',
  'd36e76d3c24e345e',
  'cdf34e63bb0568c3',
  '2b3a36b96014ae7a',
  '793703f1df97c9bd',
  'c283e80a14cb3e78',
  '3fa84d8bdea1fc61',
  '0ef84722e52cacda',
  '09b62f7d8435b906',
  'eb89b5472fdf7b54',
  '9b0bc8888f115589',
  'dc1a4c0d5ab088b8',
  '674a926638de798c',
  '861d2fb12cc6faca',
  'f3452a7e1ba43e85',
  'f7a1ac825b90c15f',
  '784473f6de36ccd4',
  '5f1c7c70e0401311',
  '6a32225e9cf27355',
  '04ce6c7e2c1a4cd6',
  '0d0d62530d74b8b0',
  'ff264a8f427960d6',
  '3d6fb87d8570f487',
  '80b0c2862693975a',
  'c5fb76e52f4cc948',
  '5da5d9680a09f20c',
  '10f320c588769cb5',
  'dafa90bbd1bcca80',
  '706e44751105cdbb',
  '3cf2e3c3c4b43c14',
  'f18d4a6b009d57f9',
  'd75667b497958033',
  '168a7c0715a01069',
  'dd024b2af561dd5a',
  'fe85f205d1c0748b',
  '753a084de01f1f49',
  '6b35d2a1aff9456a',
  'f850eb20af50be9a',
  'd7411193387e53d0',
  '52f9656e62586dc9',
  '9ef57029472b8c96',
  'd791eb34e35a9a67',
  'd7895c41d76aaf56',
  '24b40b6d992fa2f8',
  'dde347653aadf7a9',
  '2a774b46a67ff7a6',
  '2a4d02ce6b8c9e09',
  'f291291504019c24',
  '998d19d7f6deadae',
  '8e525a5d9f6053ef',
  '9db086bc27b1b9a9',
  '219d819c1826cf9d',
  'b5b9ebe1e38e968f',
  '628a316a978b2a6d',
];

export { saveSDDDataset, prodFailingCharts };
