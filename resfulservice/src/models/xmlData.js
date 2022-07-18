const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const xmlDataSchema = new Schema({
  /* !!! NOTE: had to rename 'schema' field name in restored data from MDCS to schemaId because of mongoose name conflict. */
  schemaId: {
    type: String
  },
  datasetId: {
    type: String
  },
  dttm_created: {
    type: Number
  },
  dttm_updated: {
    type: Number
  },
  // full name
  title: {
    type: String
  },
  /* !!! NOTE: MDCS stores the XML content as a BSON object parsed into the individual fields.
    Moving forward NanoMine will not use this approach, so the data was downloaded as text via the MDCS rest interface
    as a string and re-loaded into the xml_str string.  This is another reason why a dump of MDCS mongo will not restore
    and run with the new app directly.
    The migration tool will convert the 1.3.0 (no mgi_version collection) content field data and put a copy into xml_str.
    The content field is left alone. Note that for really old XMLdata records or ones where the title is not in the
    correct format, the conversion will not occur.
    bluedevil-oit/nanomine-tools project has (PRELIMINARY) code to update the field.
  */
  content: {
    type: Schema.Types.Mixed
  },
  xml_str: {
    type: String
  },
  /* numeric reference to user (probably in sqlite) - Original MDCS name for userid */
  iduser: {
    type: String
  },
  /* In the current db, these are all false */
  ispublished: {
    type: Boolean
  },
  /* Set this to true to make available to everyone */
  isPublic: {
    type: Boolean
  },
  /* currently values are Edit, Review, Curated */
  curateState: {
    type: String
  },
  /* currently values are EditedNotValid, EditedValid, Valid, NotValid, Ingesting, IngestFailed, IngestSuccess */
  entityState: {
    type: String
  },
  /* Sequence number of the associated dataset (datasetSchema) */
  dsSeq: {
    type: Number
  },
  /* 0 is the control sample */
  resultSeq: {
    type: Number
  }
}, { collection: 'xmldata' });

module.exports = mongoose.model('XmlData', xmlDataSchema);
