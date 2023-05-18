const chai = require('chai');
const sinon = require('sinon');
const XmlData = require('../../../src/models/xmlData')
const { Query: { xmlFinder, xmlViewer }} = require('../../../src/graphql/resolver');


const { expect } = chai;

const mockXmlData =  {
  "_id": "64394c8032bc6325505af6f9",
  "title": "L183_53_Portschke_2003.xml",
  "xml_str": "<xml> <CD> <TITLE>Empire Burlesque</TITLE><ARTIST>Bob Dylan</ARTIST> <COUNTRY>USA</COUNTRY> <COMPANY>Columbia</COMPANY> <PRICE>10.90</PRICE> <YEAR>1985</YEAR> </CD> </xml>"
}

const mockXmlDataList = [
  {
    "id": "64394c8032bc6325505af6f9",
    "title": "L183_53_Portschke_2003.xml",
    "entityState": "EditedValid",
    "sequence": 183
  },
  {
    "id": "64394e7232bc6325505af6fa",
    "title": "L184_53_Paidoaen33_2003.xml",
    "entityState": "EditedValid",
    "sequence": 184
  },
  {
    "id": "64394ed032bc6325505af6fb",
    "title": "L185_53_Chrysla33_2003.xml",
    "entityState": "EditedValid",
    "sequence": 185
  }
];

describe('XmlData Resolver Unit Tests:', function () {

  afterEach(() => sinon.restore());

  const req = { logger: { info: () => { }, error: () => { } } }

  context('xmlFinder', () => {
    const input = { pageNumber: 1, pageSize: 10 }

    it("should return paginated lists of xmlData when no input", async () => {
      sinon.stub(XmlData, 'countDocuments').returns(2);
      sinon.stub(XmlData, 'aggregate').returns(mockXmlDataList);

      const result = await xmlFinder({}, { input }, { req }); 

      expect(result).to.have.property('xmlData');
      expect(result.xmlData).to.be.an('Array');
    });

    it("should return paginated lists of columns", async () => {
      const input = { param: '183' };
      sinon.stub(XmlData, 'countDocuments').returns(2)
      sinon.stub(XmlData, 'aggregate').returns(mockXmlDataList);

      const result = await xmlFinder({}, { input }, { req }); 

      expect(result).to.have.property('xmlData');
      expect(result.xmlData).to.be.an('Array');
    });

    it("should throw a 500, server error", async () => {
      sinon.stub(XmlData, 'countDocuments').returns(2)
      sinon.stub(XmlData, 'aggregate').throws();
      const error = await xmlFinder({}, { input }, { req }); 

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });

  context('xmlViewer', () => {
    const input = { pageNumber: 1, pageSize: 10 }

    it("should return a 404 not found error", async () => {
      sinon.stub(XmlData, 'findOne').returns(null);

      const error = await xmlViewer({}, { input }, { req }); 

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(404);
    });

    it("should return an xmldata", async () => {
      sinon.stub(XmlData, 'findOne').returns(mockXmlData);

      const result = await xmlViewer({}, { input }, { req }); 

      expect(result).to.have.property('xmlString');
      expect(result).to.have.property('title');

    });

    it("should throw a 500, server error", async () => {
      sinon.stub(XmlData, 'findOne').throws();
      const error = await xmlViewer({}, { input }, { req }); 

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });
});
