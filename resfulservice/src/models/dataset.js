const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const datasetSchema = new Schema({
  author: [String], /* Authors, first is primary */
  chapter: String, /* Chapter of book */
  citationType: String, /* study, book, article, paper -- fixed set -- required field */
  datasetComment: String, /* general comment about the dataset */
  dateOfCitation: String, /* Originally: PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields.DateOfCitation */
  datasetId: String, /* the _id of this dataset record as a string, set by create */
  doi: String, /* DOI or other unique assigned handle -- must be unique */
  dttm_created: Number,
  dttm_updated: Number,
  edition: String,
  editor: String,
  isDeleted: Boolean, /* Logically deleted if true */
  isPublic: Boolean, /* available to everyone */
  ispublished: Boolean, /* could use this to flag actually published */
  isbn: String,
  issn: String, /* Originally: PolymerNanocomposite.DATA_SOURCE.Citation.CitationType.Journal.ISSN */
  issue: String, /* Originally: PolymerNanocomposite.DATA_SOURCE.Citation.CitationType.Journal.Issue */
  keyword: [String], /* Keywords. NOTE: some are multi-word */
  language: String, /* English, etc */
  location: String, /* Originally: PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields.Location */
  publication: String, /* Journal name, book name, etc */
  publicationYear: Number, /* 2005, etc. */
  publisher: String, /* publisher */
  relatedDoi: [String], /* dois that this dataset is related to */
  filesets: [mongoose.Schema.Types.Mixed], /*
    Array of
    { 'filesetName': 'fileset name',
      'files': [{
          type: 'blob' | 'xmldata',
          id: blobid | xmldata._id, // must be ObjectId or convertable to one
          metadata: [ // Optional
             {key, value}, ...
          ]
        } ... ]
    }
    */
  seq: Number, /* not unique because of xml sets of prior versions -- required field (set by create) */
  title: String, /* Name of study, book, article, paper, etc -- required field */
  url: String, /* Best url to access paper, book, etc */
  userid: String, /* creator's user id */
  volume: String /* 1-12 for monthly, could be others for weekly, semi-monthly, etc */
  // latestSchema: Boolean, /* Has associated xml_data recs for latest schema. If not, then lookups of xmls for latest schema using this dsSeq will fail */
}, { collection: 'datasets' });

module.exports = mongoose.model('datasets', datasetSchema);
