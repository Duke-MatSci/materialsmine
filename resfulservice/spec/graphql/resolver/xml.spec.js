const chai = require('chai');
const sinon = require('sinon');
const { fetchedCuratedXlsxObject } = require('../../mocks');
const XmlData = require('../../../src/models/xmlData');
const XlsxFileManager = require('../../../src/utils/curation-utility');
const {
  Query: { xmlFinder, xmlViewer }
} = require('../../../src/graphql/resolver');
const CuratedSamples = require('../../../src/models/curatedSamples');

const { expect } = chai;

const mockXmlData = {
  _id: '64394c8032bc6325505af6f9',
  title: 'L183_53_Portschke_2003.xml',
  xml_str:
    '<xml> <CD> <TITLE>Empire Burlesque</TITLE><ARTIST>Bob Dylan</ARTIST> <COUNTRY>USA</COUNTRY> <COMPANY>Columbia</COMPANY> <PRICE>10.90</PRICE> <YEAR>1985</YEAR> </CD> </xml>',
  entityState: 'EditedValid'
};

const mockXmlDataList = [
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

describe('XmlData Resolver Unit Tests:', function () {
  afterEach(() => sinon.restore());

  const req = { logger: { info: () => {}, error: () => {} } };

  context('xmlFinder', () => {
    const input = {
      pageNumber: 1,
      pageSize: 10,
      filter: {
        status: 'Not_Approved',
        param: '183',
        user: '64394e7232bc6325505af6fa'
      }
    };

    it('should return paginated lists of xmlData when no input', async () => {
      sinon.stub(XmlData, 'countDocuments').returns(2);
      sinon.stub(CuratedSamples, 'countDocuments').returns(1);
      sinon
        .stub(XmlData, 'aggregate')
        .returns([{ count: mockXmlDataList.length, xmlData: mockXmlDataList }]);

      const result = await xmlFinder({}, { input }, { req });

      expect(result).to.have.property('xmlData');
      expect(result.xmlData).to.be.an('Array');

      expect(result.xmlData[0]).to.have.property('id', mockXmlDataList[0].id);
      expect(result.xmlData[0]).to.have.property(
        'title',
        mockXmlDataList[0].title
      );
      expect(result.xmlData[0]).to.have.property(
        'status',
        mockXmlDataList[0].status
      );
      expect(result.xmlData[0]).to.have.property(
        'isNewCuration',
        mockXmlDataList[0].isNewCuration
      );
      expect(result.xmlData[0]).to.have.property(
        'sequence',
        mockXmlDataList[0].sequence
      );
      expect(result.xmlData[0]).to.have.property(
        'user',
        mockXmlDataList[0].user
      );
    });

    it('should return paginated lists of columns', async () => {
      sinon.stub(XmlData, 'countDocuments').returns(2);
      sinon.stub(CuratedSamples, 'countDocuments').returns(1);

      sinon
        .stub(XmlData, 'aggregate')
        .returns([{ count: mockXmlDataList.length, xmlData: mockXmlDataList }]);

      const result = await xmlFinder({}, { input }, { req });

      expect(result).to.have.property('xmlData');
      expect(result.xmlData).to.be.an('Array');

      expect(result.xmlData[1]).to.have.property('id', mockXmlDataList[1].id);
      expect(result.xmlData[1]).to.have.property(
        'title',
        mockXmlDataList[1].title
      );
      expect(result.xmlData[1]).to.have.property(
        'status',
        mockXmlDataList[1].status
      );
      expect(result.xmlData[1]).to.have.property(
        'isNewCuration',
        mockXmlDataList[1].isNewCuration
      );
      expect(result.xmlData[1]).to.have.property(
        'sequence',
        mockXmlDataList[1].sequence
      );
      expect(result.xmlData[1]).to.have.property(
        'user',
        mockXmlDataList[1].user
      );
    });

    it('should throw a 500, server error', async () => {
      sinon.stub(XmlData, 'countDocuments').returns(2);
      sinon.stub(CuratedSamples, 'countDocuments').returns(1);
      sinon.stub(XmlData, 'aggregate').throws();
      const error = await xmlFinder({}, { input }, { req });

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });

  context('xmlViewer', () => {
    const input = { id: '64394e7232bc6325505af6fa' };

    it('should return a 404 not found error', async () => {
      sinon.stub(XmlData, 'findOne').returns(null);

      const error = await xmlViewer({}, { input }, { req });

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(404);
    });

    it('should return an xmldata', async () => {
      sinon.stub(XmlData, 'findOne').returns(mockXmlData);

      const result = await xmlViewer({}, { input }, { req });

      expect(result).to.have.property('xmlString');
      expect(result).to.have.property('title');
      expect(result).to.have.property('status', 'Not Approved');
    });

    it('should return a curated sample data', async () => {
      sinon.stub(CuratedSamples, 'findOne').returns(fetchedCuratedXlsxObject);
      sinon.stub(XlsxFileManager, 'xmlGenerator').returns(mockXmlData.xml_str);
      const result = await xmlViewer(
        {},
        { input: { ...input, isNewCuration: true } },
        { req }
      );

      expect(result).to.have.property('xmlString');
      expect(result).to.have.property('title');
      expect(result).to.have.property('status', 'Not Approved');
    });

    it('should return a 404 not found error for curatedsample data', async () => {
      sinon.stub(CuratedSamples, 'findOne').returns(null);

      const error = await xmlViewer(
        {},
        { input: { ...input, isNewCuration: true } },
        { req }
      );

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(404);
    });

    it('should throw a 500, server error', async () => {
      sinon.stub(XmlData, 'findOne').throws();
      const error = await xmlViewer({}, { input }, { req });

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });
});
