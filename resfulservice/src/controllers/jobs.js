const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const XmlData = require('../models/xmlData');
const CuratedSample = require('../models/curatedSamples');
const {
  CurationStateSubstitutionMap,
  CurationEntityStates
} = require('../../config/constant');
const { latencyCalculator } = require('../middlewares/latencyTimer');
const { errorWriter, successWriter } = require('../utils/logWriter');
const FileManager = require('../utils/fileManager');

/**
 * Updates curateState/curationState for a single MongoDB _id.
 * Tries xmldata first, falls back to curatedsamples.
 * @param {string} id - MongoDB ObjectId string
 * @param {string} status - Target status (e.g. 'Completed', 'Curated')
 * @returns {{ xmlUpdated: boolean, curatedSampleUpdated: boolean }}
 */
exports.updateStatus = async (id, status) => {
  const xmlResult = await XmlData.updateOne(
    { _id: id },
    { $set: { curateState: status, entityState: 'IngestSuccess' } }
  );
  if (xmlResult.matchedCount > 0) {
    return { xmlUpdated: true, curatedSampleUpdated: false };
  }
  const mappedStatus = CurationStateSubstitutionMap[status] || status;
  const curatedResult = await CuratedSample.updateOne(
    { _id: id },
    {
      $set: {
        curationState: mappedStatus,
        entityState: CurationEntityStates.Approved
      }
    }
  );
  return {
    xmlUpdated: false,
    curatedSampleUpdated: curatedResult.matchedCount > 0
  };
};

exports.adjustXmlStatus = async (req, res, next) => {
  const { status, text, filename } = req.body;

  try {
    if (!status) {
      latencyCalculator(res);
      return res.status(400).json({ message: 'Status is required' });
    }

    if (!text && !filename) {
      latencyCalculator(res);
      return res
        .status(400)
        .json({ message: 'Either text or filename is required' });
    }

    if (text && filename) {
      latencyCalculator(res);
      return res
        .status(400)
        .json({ message: 'Provide either text or filename, not both' });
    }

    let rawIds;
    let filePath;

    if (text) {
      rawIds = text
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    } else {
      filePath = path.join(req.env?.FILES_DIRECTORY || 'mm_files', filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      rawIds = fileContent
        .split(/\r?\n/)
        .map((id) => id.trim())
        .filter(Boolean);
    }

    const invalidIds = [];
    const validIds = [];

    for (const id of rawIds) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        validIds.push(id);
      } else {
        invalidIds.push(id);
      }
    }

    // Update xmldata collection
    const xmlUpdateResult = await XmlData.updateMany(
      { _id: { $in: validIds } },
      { $set: { curateState: status } }
    );

    // Find which IDs exist in xmldata to determine remaining ones
    const foundInXml = await XmlData.find(
      { _id: { $in: validIds } },
      { _id: 1 }
    );
    const foundXmlIds = new Set(foundInXml.map((doc) => doc._id.toString()));
    const remainingIds = validIds.filter((id) => !foundXmlIds.has(id));

    // Update curatedsamples collection for remaining IDs
    let curatedSamplesUpdated = 0;
    const failed = [];

    if (remainingIds.length > 0) {
      const mappedStatus = CurationStateSubstitutionMap[status] || status;
      const curatedUpdateResult = await CuratedSample.updateMany(
        { _id: { $in: remainingIds } },
        { $set: { curationState: mappedStatus } }
      );
      curatedSamplesUpdated = curatedUpdateResult.modifiedCount;

      // Find which remaining IDs exist in curatedsamples
      const foundInCurated = await CuratedSample.find(
        { _id: { $in: remainingIds } },
        { _id: 1 }
      );
      const foundCuratedIds = new Set(
        foundInCurated.map((doc) => doc._id.toString())
      );
      for (const id of remainingIds) {
        if (!foundCuratedIds.has(id)) {
          failed.push(id);
        }
      }
    }

    // Clean up file if filename was provided
    if (filename && filePath) {
      FileManager.deleteFile(filePath, req);
    }

    successWriter(req, 'Successfully adjusted XML status', 'adjustXmlStatus');
    latencyCalculator(res);
    return res.status(200).json({
      data: {
        xmlDataUpdated: xmlUpdateResult.modifiedCount,
        curatedSamplesUpdated,
        failed,
        invalidIds
      }
    });
  } catch (error) {
    next(errorWriter(req, error, 'adjustXmlStatus', 500));
  }
};
