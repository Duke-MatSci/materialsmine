const sinon = require('sinon');

const mockComment = {
  comment: 'test comment',
  type: 'xml',
  identifier: '64394c8032bc6325505af6f9',
  user: '64394c8032bc6325505af6f9'
};

const mockCommentInput = {
  id: '64394c8032bc6325505af6f9',
  comment: 'test comment',
  type: 'xml',
  identifier: '64394c8032bc6325505af6f9'
};

const mockDBComment = {
  user: {
    givenName: 'Test',
    surName: 'Test'
  },
  ...mockComment,
  lean: () => this,
  populate: sinon.stub().returnsThis()
};

const mockCommentList = [
  {
    _id: '64397a5cdffb639553bf62e4',
    comment: 'first comment',
    user: {
      givenName: 'Test',
      surName: 'Test'
    },
    createdAt: '1681488476581',
    updatedAt: '1681489494515'
  },
  {
    _id: '64397a5cdffb639553bf62e4',
    comment: 'secont comment',
    user: {
      givenName: 'Test',
      surName: 'Test'
    },
    createdAt: '1681488476581',
    updatedAt: '1681489494515'
  }
];

const mockContact = {
  fullName: 'test user',
  email: 'test@example.com',
  purpose: 'QUESTION',
  message: 'test message',
  attachments: [
    '/api/files/strategic_beetle_joelle-2024-02-15T09:25:42.264Z-master_template (5).xlsx?isStore=true',
    '/api/files/strategic_beetle_joelle-2024-02-15T09:27:07.905Z-master_template.xlsx?isStore=true'
  ]
};

const mockUserContact = {
  _id: 'akdn9wqkn',
  fullName: 'test user',
  email: 'test@example.com',
  purpose: 'QUESTION',
  message: 'test message',
  lean: () => this
};

const mockUpdatedContact = {
  ...mockContact,
  resolved: true,
  response: 'Thanks for reaching out. We are working on it'
};

const user = {
  _id: '62dab1b76db8739c8330611d',
  alias: 'testalias',
  givenName: 'test',
  surName: 'test user',
  displayName: 'tester',
  userid: '62dab1b76db8739c8330611d',
  email: 'test@example.com',
  roles: 'member'
};

const mockDataset = {
  _id: '62f11b1328eedaab012d127c',
  datasetId: '62f11b1328eedaab012d127c',
  userid: '62f119fb28eedaab012d1262',
  filesets: [
    {
      fileset: 'E109_S2_Huang_2016',
      files: [
        {
          type: 'blob',
          id: '5b51f112e74a1d4cdbad6a1d',
          metadata: {
            filename: '4.tif',
            contentType: 'image/tiff'
          }
        },
        {
          type: 'blob',
          id: '5b51f137e74a1d4cdbad6a3a',
          metadata: {
            filename: '5.tif',
            contentType: 'image/tiff'
          }
        }
      ]
    }
  ],
  skip: sinon.stub().returnsThis(),
  limit: sinon.stub().returnsThis(),
  lean: sinon.stub().returnsThis()
};

const mockFiles = {
  doi: 'unpublished/doi-tMbKM2ba5aNwo2ZKPVucBS',
  datasetId: '62fce36374da548513a38a9b',
  files: [
    {
      fieldname: 'uploadfile',
      originalname: 'Hopetoun_falls.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: 'mm_files',
      filename:
        'comparative_aphid_agathe-2022-08-18T10:00:40.910Z-Hopetoun_falls.jpg',
      path: 'mm_files/comparative_aphid_agathe-2022-08-18T10:00:40.910Z-Hopetoun_falls.jpg',
      size: 2954043
    },
    {
      fieldname: 'uploadfile',
      originalname: 'flowers-276014__340.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: 'mm_files',
      filename:
        'comparative_aphid_agathe-2022-08-18T10:00:41.018Z-flowers-276014__340.jpg',
      path: 'mm_files/comparative_aphid_agathe-2022-08-18T10:00:41.018Z-flowers-276014__340.jpg',
      size: 56575
    }
  ]
};

const mockColumn = {
  field: 'Flight_width::Uniter',
  values: ['nm', 'um', 'mm', 'cm', 'm']
};

const mockColumnsInput = {
  columns: [
    {
      field: 'Flight_width::Units',
      values: ['nm', 'um', 'mm', 'cm', 'm']
    },
    {
      field: 'Origins',
      values: [
        'experiments',
        'informatics (data science)',
        'simulations',
        'theory'
      ]
    }
  ]
};

const mockDBColumn = {
  _id: 'kas2344nlkla',
  ...mockColumn,
  lean: () => this
};

const mockConflictError = {
  writeErrors: [
    {
      err: {
        index: 0,
        code: 11000,
        errmsg:
          'E11000 duplicate key error collection: mgi.materialtemplates index: field_1 dup key: { field: "Flight_width::Units" }'
      }
    },
    {
      err: {
        index: 1,
        code: 11000,
        errmsg:
          'E11000 duplicate key error collection: mgi.materialtemplates index: field_1 dup key: { field: "Origins" }'
      }
    }
  ]
};

const pixelatedDataInput = {
  unitCell: 'TEN',
  pageNumber: 1,
  pageSize: 1
};

const mockPixelData = {
  _id: 'akdn9wqknd90uaoikn9ahoi4489i',
  symmetry: 'C4v',
  unit_cell_x_pixels: '10',
  unit_cell_y_pixels: '10',
  geometry_condensed: '000000000001001',
  geometry_full:
    '1010000101000000000010000000010000000000000000000000000000000000000000100000000100000000001010000101',
  condition: 'Plane Strain',
  C11: '2963290579',
  C12: '1459531181',
  C22: '2963290579',
  skip: () => ({ _id: 'akdn9wqkn', ...pixelatedDataInput }),
  lean: () => ({ _id: 'akdn9wqkn', ...pixelatedDataInput }),
  limit: () => ({ _id: 'akdn9wqkn', ...pixelatedDataInput })
};

const mockDBXmlData = {
  _id: '64394c8032bc6325505af6f9',
  title: 'L183_53_Portschke_2003.xml',
  xml_str:
    '<xml> <CD> <TITLE>Empire Burlesque</TITLE><ARTIST>Bob Dylan</ARTIST> <COUNTRY>USA</COUNTRY> <COMPANY>Columbia</COMPANY> <PRICE>10.90</PRICE> <YEAR>1985</YEAR> </CD> </xml>',
  entityState: 'EditedValid'
};

const mockDBXmlDataList = [
  {
    id: '6622848a808bdbee354f96d3',
    title: 'L311_S10_Lou_2009.xml',
    status: 'Not Approved',
    isNewCuration: false,
    sequence: 311,
    user: '65b8ec85c3d3b2ed82fe4029'
  },
  {
    id: '65cf719860df704a1ca74428',
    title: 'E0_S1_Uthdev_2003.xml',
    status: 'Approved',
    isNewCuration: true,
    sequence: null,
    user: '65b8ec85c3d3b2ed82fe4029'
  }
];

module.exports = {
  mockComment,
  mockCommentInput,
  mockDBComment,
  mockCommentList,
  mockContact,
  mockUserContact,
  mockUpdatedContact,
  mockDataset,
  mockFiles,
  mockColumn,
  mockColumnsInput,
  mockDBColumn,
  mockConflictError,
  mockPixelData,
  pixelatedDataInput,
  mockDBXmlDataList,
  mockDBXmlData,
  user
};
