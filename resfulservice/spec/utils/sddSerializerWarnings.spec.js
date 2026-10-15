'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const XLSX = require('xlsx');
const { Readable } = require('stream');
const { logger } = require('../common/utils');
const minioClient = require('../../src/utils/minio');
const { buildSddAttributes } = require('../../src/utils/sdd-serializer');

const NP_ID = 'http://materialsmine.org/np/test';
const SDD_NAME = 'abc123-sdd.xlsx';

function makeDictRow(overrides = {}) {
  const row = {
    column: '',
    label: '',
    comment: '',
    definition: '',
    attribute: '',
    attributeOf: '',
    unit: '',
    format: '',
    time: '',
    entity: '',
    role: '',
    relation: '',
    inRelationTo: '',
    wasDerivedFrom: '',
    wasGeneratedBy: '',
    template: '',
    ...overrides
  };
  return Object.values(row);
}

function buildSddXlsx(dictRows) {
  const wb = XLSX.utils.book_new();
  const header = [
    'Column',
    'Label',
    'Comment',
    'Definition',
    'Attribute',
    'attributeOf',
    'Unit',
    'Format',
    'Time',
    'Entity',
    'Role',
    'Relation',
    'inRelationTo',
    'wasDerivedFrom',
    'wasGeneratedBy',
    'Template'
  ];
  const sheet = XLSX.utils.aoa_to_sheet([header, ...dictRows]);
  XLSX.utils.book_append_sheet(wb, sheet, 'Dictionary Mapping');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function distEntry(objectName) {
  return {
    '@id': `http://localhost/api/files/${objectName}?isStore=true`,
    'rdfs:label': objectName
  };
}

function distribution(objectNames) {
  return {
    'mm:hasDistribution': {
      'dcat:distribution': objectNames.map(distEntry)
    }
  };
}

// Serve each object name from an in-memory store, a fresh stream per call.
function stubStore(contents) {
  return sinon.stub(minioClient, 'getObject').callsFake((bucket, name) => {
    if (!(name in contents)) throw new Error(`unexpected object ${name}`);
    const body = contents[name];
    return Readable.from(body === '' ? [] : [body]);
  });
}

describe('buildSddAttributes recoverable problems', function () {
  let warningSpy;

  beforeEach(function () {
    warningSpy = sinon.spy(logger, 'warning');
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should warn about dictionary columns missing from a CSV and keep its rows', async function () {
    const csvName = 'abc123-data.csv';
    stubStore({
      [SDD_NAME]: buildSddXlsx([
        makeDictRow({ column: 'Temperature', attribute: 'sio:Temperature' }),
        makeDictRow({ column: 'Pressure', attribute: 'sio:Pressure' })
      ]),
      [csvName]: 'Temperature\n25\n30\n'
    });

    const { allCsvRows } = await buildSddAttributes(
      distribution([SDD_NAME, csvName]),
      NP_ID,
      logger
    );

    expect(allCsvRows).to.deep.equal([
      { Temperature: '25' },
      { Temperature: '30' }
    ]);
    sinon.assert.calledWithMatch(warningSpy, sinon.match('Pressure'));
  });

  it('should warn about and skip an empty CSV while keeping the data CSV rows', async function () {
    const emptyName = 'abc123-empty.csv';
    const dataName = 'abc123-data.csv';
    stubStore({
      [SDD_NAME]: buildSddXlsx([
        makeDictRow({ column: 'Temperature', attribute: 'sio:Temperature' })
      ]),
      [emptyName]: '',
      [dataName]: 'Temperature\n25\n'
    });

    const { allCsvRows } = await buildSddAttributes(
      distribution([SDD_NAME, emptyName, dataName]),
      NP_ID,
      logger
    );

    expect(allCsvRows).to.deep.equal([{ Temperature: '25' }]);
    sinon.assert.calledWithMatch(warningSpy, sinon.match(emptyName));
  });

  it('should warn about a referenced file that is not in the distribution', async function () {
    const csvName = 'abc123-data.csv';
    stubStore({
      [SDD_NAME]: buildSddXlsx([
        makeDictRow({ column: 'Temperature', attribute: 'sio:Temperature' }),
        makeDictRow({ column: 'Datafile', format: 'file' })
      ]),
      [csvName]: 'Temperature,Datafile\n25,missing.png\n'
    });

    const { allCsvRows } = await buildSddAttributes(
      distribution([SDD_NAME, csvName]),
      NP_ID,
      logger
    );

    expect(allCsvRows).to.have.lengthOf(1);
    expect(allCsvRows[0].Temperature).to.equal('25');
    sinon.assert.calledWithMatch(warningSpy, sinon.match('missing.png'));
  });
});
