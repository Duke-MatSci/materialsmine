/* eslint-disable camelcase */
/* eslint-disable space-before-function-paren */
// https://github.com/prettier/prettier/issues/3847
const CH = require('./curation-utility'); // Curation Helper
const { MM_BASE, NP_BASE } = require('../../config/constant');
const { CONTEXT } = require('../../config/jsonld-context');
const jsonld = require('jsonld');
const {
  manageServiceRequest
} = require('../controllers/managedServiceController');
const { Writer, namedNode, literal, quad } = require('n3');
const {
  asDecimal,
  mapUnit,
  toArray,
  pick,
  slug,
  hasText,
  extractBlobId,
  extractBareDOI,
  toDoiIri,
  fetchPaperDetails,
  prepareForValidation
} = CH;

async function buildArticle(common, logger) {
  // Existing XML-based fields
  const xmlTitle = pick(common, 'Title');
  const xmlPublication = pick(common, 'Publication');
  const xmlDOI = pick(common, 'DOI');
  const xmlPublicationYear = pick(common, 'PublicationYear');
  const xmlAuthors = toArray(pick(common, 'Author'));
  const language = pick(common, 'Language') || undefined;
  const issue = pick(common, 'Issue') || undefined;
  const keywords = toArray(pick(common, 'Keywords.Keyword')) || [];
  const volume = pick(common, 'Volume') || undefined;

  // DOI handling
  const doiBare = extractBareDOI(xmlDOI);
  const doiIri = toDoiIri(xmlDOI);

  // Try OpenAlex ONLY if DOI present
  const oa = doiBare ? await fetchPaperDetails(doiBare, logger) : null;

  // ----- Authors: prefer OpenAlex when available; else fall back to XML -----
  let authorsArr = [];
  if (oa && Array.isArray(oa.authorships) && oa.authorships.length) {
    authorsArr = oa.authorships.map((a, idx) => {
      const display =
        a?.author?.display_name || a?.raw_author_name || `author-${idx + 1}`;
      const s = slug(display);
      return {
        id: `${MM_BASE}agent/${s}`,
        type: 'schema:Person',
        name: display
      };
    });
  } else {
    authorsArr = xmlAuthors.map((nameStr, idx) => {
      const s = slug(String(nameStr) || `author-${idx + 1}`);
      return {
        id: `${MM_BASE}agent/${s}`,
        type: 'schema:Person',
        name: String(nameStr)
      };
    });
  }

  // ----- Core keys (must always be present) -----
  // id: prefer DOI IRI; else slugged title
  const baseId =
    doiIri || `${MM_BASE}article/${slug(oa?.title || xmlTitle || 'untitled')}`;

  // name/title
  const name = oa?.title || xmlTitle;

  // identifier: prefer DOI (IRI), else leave undefined if none
  const identifier = doiIri || xmlDOI || undefined;

  // sameAs: prefer DOI IRI
  const sameAs = doiIri || undefined;

  // datePublished: prefer OA publication_date (year), else XML PublicationYear
  const datePublished =
    (oa?.publication_date
      ? String(oa.publication_date).slice(0, 4)
      : undefined) ||
    xmlPublicationYear ||
    undefined;

  // author (IDs)
  const authorIds = authorsArr.map((a) => a.id);

  // schema:publication: prefer OA.journal, else XML Publication
  const schemaPublication = oa?.journal || xmlPublication || undefined;

  const article = {
    id: baseId,
    type: 'schema:ScholarlyArticle',
    title: name,
    doi: identifier,
    sameAs,
    datePublished,
    author: authorIds,
    'schema:publication': schemaPublication,
    language,
    issue,
    keywords,
    volume
  };

  // ----- Optional keys (only adding if present in OA) -----
  // language, issue, keywords, relatedWorks, versions, url, journal,
  // countsByYear, publisher, primaryLocation
  if (oa) {
    if (oa.language) article.language = oa.language;
    const issue = oa.issue || oa?.biblio?.issue;
    if (issue) article.issue = issue;

    // Prefer explicit keywords; fall back to concepts' display names if available
    if (Array.isArray(oa.keywords) && oa.keywords.length) {
      article.keywords = oa.keywords.map(
        (k) => k.display_name || k.id || String(k)
      );
    } else if (Array.isArray(oa.concepts) && oa.concepts.length) {
      article.keywords = oa.concepts
        .map((c) => c.display_name || c.id)
        .filter(Boolean);
    }

    if (Array.isArray(oa.related_works) && oa.related_works.length) {
      article.relatedWorks = oa.related_works;
    }
    if (Array.isArray(oa.versions) && oa.versions.length) {
      article.versions = oa.versions;
    }

    const url =
      oa?.primary_location?.landing_page_url ||
      oa?.primary_location?.pdf_url ||
      oa?.url;
    if (url) article.url = url;

    if (oa.journal) article.journal = oa.journal;
    // inside buildArticle, where we set optional fields from OpenAlex:
    if (Array.isArray(oa?.counts_by_year) && oa.counts_by_year.length) {
      article.countsByYear = oa.counts_by_year.map(
        ({ year, cited_by_count }) => ({
          year: typeof year === 'number' ? year : Number(year),
          citedByCount:
            typeof cited_by_count === 'number'
              ? cited_by_count
              : Number(cited_by_count)
        })
      );
    }
    if (oa.publisher) article.publisher = oa.publisher;
    if (oa.primary_location) article.primaryLocation = oa.primary_location;
  }

  return { article, authors: authorsArr };
}

function makeAttr({ typeIri, label, value, unit, baseId }) {
  const attrId = `${baseId}/attr/${slug(label || typeIri || 'attr')}`;
  const unitIri = mapUnit(unit);
  const obj = {
    id: attrId,
    type: typeIri || 'mm:Property',
    'rdfs:label': label,
    hasValue: asDecimal(value) ?? String(value)
  };
  if (unitIri) obj.hasUnit = unitIri;
  else if (unit) obj.hasUnit = String(unit);
  return obj;
}

// function extractAttributes(pnc, baseId) {
//   const attrs = [];

//   // --- helpers (local) ---
//   const litStr = (v) =>
//     v == null ? null : { '@value': String(v), '@type': 'xsd:string' };
//   const litNum = (v) => {
//     if (v == null) return null;
//     const n = typeof v === 'number' ? v : parseFloat(String(v));
//     return Number.isFinite(n) ? { '@value': n, '@type': 'xsd:double' } : null;
//   };
//   const asArray = (x) => (Array.isArray(x) ? x : x != null ? [x] : []);

//   // -------------------------------------------------
//   // Weibull
//   // -------------------------------------------------
//   const weibull = pick(
//     pnc,
//     'PolymerNanocomposite.PROPERTIES.Electrical.DielectricBreakdownStrength.WeibullParameter'
//   );
//   if (weibull && typeof weibull === 'object') {
//     attrs.push(
//       makeAttr({
//         typeIri: 'mm:WeibullParameter',
//         label: 'DielectricBreakdownStrength_WeibullParameter',
//         value: pick(weibull, 'value'),
//         unit: pick(weibull, 'unit'),
//         baseId
//       })
//     );
//   }

//   // -------------------------------------------------
//   // MATRIX COMPONENTS
//   // -------------------------------------------------
//   const matrix = toArray(
//     pick(pnc, 'PolymerNanocomposite.MATERIALS.Matrix.MatrixComponent')
//   );

//   if (matrix.length) {
//     // Build mm:MatrixComponent nodes (one per occurrence)
//     const componentNodes = matrix.map((mc, idx) => {
//       const componentId =
//         idx === 0
//           ? `${baseId}/MatrixComponents`
//           : `${baseId}/MatrixComponents/${idx + 1}`;

//       const componentAttrs = [];

//       // ChemicalName
//       const chemicalName = pick(mc, 'ChemicalName');
//       if (hasText(chemicalName)) {
//         componentAttrs.push({
//           id: `${componentId}/ChemicalName`,
//           type: 'mm:ChemicalName',
//           hasValue: litStr(chemicalName)
//         });
//       }

//       // Abbreviation
//       const abbreviation = pick(mc, 'Abbreviation');
//       if (hasText(abbreviation)) {
//         componentAttrs.push({
//           id: `${componentId}/abbreviation`,
//           type: 'mm:Abbreviation',
//           hasValue: litStr(abbreviation)
//         });
//       }

//       // ConstitutionalUnit
//       const constitutionalUnit = pick(mc, 'ConstitutionalUnit');
//       if (hasText(constitutionalUnit)) {
//         componentAttrs.push({
//           id: `${componentId}/ConstitutionalUnit`,
//           type: 'mm:ConstitutionalUnit',
//           hasValue: litStr(constitutionalUnit)
//         });
//       }

//       // StdChemicalName
//       const stdChemicalName = pick(mc, 'StdChemicalName');
//       if (hasText(stdChemicalName)) {
//         componentAttrs.push({
//           id: `${componentId}/StdChemicalName`,
//           type: 'mm:StdChemicalName',
//           hasValue: litStr(stdChemicalName)
//         });
//       }

//       // SMILES
//       const smiles = pick(mc, 'SMILES');
//       if (hasText(smiles)) {
//         componentAttrs.push({
//           id: `${componentId}/SMILES`,
//           type: 'mm:SMILES',
//           hasValue: litStr(smiles)
//         });
//       }

//       // uSMILES
//       const uSMILES = pick(mc, 'uSMILES');
//       if (hasText(constitutionalUnit)) {
//         componentAttrs.push({
//           id: `${componentId}/uSMILES`,
//           type: 'mm:uSMILES',
//           hasValue: litStr(uSMILES)
//         });
//       }

//       // PubChemRef
//       const pubChemRef = pick(mc, 'PubChemRef');
//       if (hasText(pubChemRef)) {
//         componentAttrs.push({
//           id: `${componentId}/PubChemRef`,
//           type: 'mm:PubChemReference',
//           hasValue: litStr(pubChemRef)
//         });
//       }

//       // PolymerClass (string entry)
//       const polymerClass = pick(mc, 'PolymerClass');
//       if (hasText(polymerClass)) {
//         componentAttrs.push({
//           id: `${componentId}/PolymerClass`,
//           type: 'mm:PolymerClass',
//           hasValue: litStr(polymerClass)
//         });
//       }

//       // Hardener (string entry)
//       const hardener = pick(mc, 'Hardener');
//       if (hasText(hardener)) {
//         componentAttrs.push({
//           id: `${componentId}/Hardener`,
//           type: 'mm:Hardener',
//           hasValue: litStr(hardener)
//         });
//       }

//       // Tacticity (string entry from enumerated value)
//       const tacticity = pick(mc, 'Tacticity');
//       if (hasText(tacticity)) {
//         componentAttrs.push({
//           id: `${componentId}/Tacticity`,
//           type: 'mm:Tacticity',
//           hasValue: litStr(tacticity)
//         });
//       }

//       // PlasticType
//       const plasticType = pick(mc, 'PlasticType');
//       if (hasText(plasticType)) {
//         componentAttrs.push({
//           id: `${componentId}/PlasticType`,
//           type: 'mm:Plastic',
//           hasValue: litStr(plasticType)
//         });
//       }

//       // PolymerType (label only, per your spec)
//       const polymerType = pick(mc, 'PolymerType');
//       if (hasText(polymerType)) {
//         componentAttrs.push({
//           id: `${componentId}/PolymerType`,
//           'rdfs:label': 'Type of polymer based on monomer characteristics',
//           hasValue: litStr(polymerType)
//         });
//       }

//       // ManufacturerName
//       const manufacturer = pick(mc, 'ManufacturerName');
//       if (hasText(manufacturer)) {
//         componentAttrs.push({
//           id: `${componentId}/ManufacturerName`,
//           type: 'mm:ManufacturerOrSourceName',
//           hasValue: litStr(manufacturer)
//         });
//       }

//       // TradeName
//       const tradeName = pick(mc, 'TradeName');
//       if (hasText(tradeName)) {
//         componentAttrs.push({
//           id: `${componentId}/TradeName`,
//           type: 'mm:TradeName',
//           hasValue: litStr(tradeName)
//         });
//       }

//       // Polydispersity (numeric)
//       const polydispersity = pick(mc, 'Polydispersity');
//       const polyLit = litNum(polydispersity);
//       if (polyLit) {
//         componentAttrs.push({
//           id: `${componentId}/polydispersity`,
//           type: 'mm:Polydispersity',
//           hasValue: polyLit
//         });
//       }

//       // MatrixComponentComposition → Constituent(s)
//       const mcc = pick(mc, 'MatrixComponentComposition');
//       if (mcc && typeof mcc === 'object') {
//         const constituents = asArray(pick(mcc, 'Constituent')).filter(hasText);
//         if (constituents.length) {
//           const subAttrs = constituents.map((c, i) => ({
//             id:
//               i === 0
//                 ? `${componentId}/matrix_component_composition/constituent`
//                 : `${componentId}/matrix_component_composition/constituent/${
//                     i + 1
//                   }`,
//             type: 'mm:Constituent',
//             hasValue: litStr(c)
//           }));

//           componentAttrs.push({
//             id: `${componentId}/MatrixComponentComposition`,
//             type: 'mm:MatrixComponentComposition',
//             'hasAttribute': subAttrs
//           });
//         }
//       }

//       // MolecularWeight (can be 1..n) with rule: if only one and no description => default to Mw
//       const mws = asArray(pick(mc, 'MolecularWeight'));
//       if (mws.length) {
//         const mwSubAttrs = [];
//         mws.forEach((mw, i) => {
//           if (!mw || typeof mw !== 'object') return;
//           const desc = (pick(mw, 'description') || '').toString().toLowerCase();

//           // Determine type
//           let typeIri = null;
//           if (desc.includes('number average')) {
//             typeIri = 'mm:MolecularWeight_Mn';
//           } else if (desc.includes('weight average')) {
//             typeIri = 'mm:MolecularWeight_Mw';
//           }

//           // If single item and no description -> default to Mw
//           if (
//             !typeIri &&
//             mws.length === 1 &&
//             !hasText(pick(mw, 'description'))
//           ) {
//             typeIri = 'mm:MolecularWeight_Mw';
//           }
//           if (!typeIri) typeIri = 'mm:MolecularWeight_Mw';

//           const v = pick(mw, 'value.value') ?? pick(mw, 'value'); // support either shape
//           const u = pick(mw, 'value.unit') ?? pick(mw, 'unit');

//           const vLit = litNum(v);
//           if (!vLit) return;

//           const sub = {
//             id: `${componentId}/MolecularWeight/${i + 1}`,
//             type: typeIri,
//             hasValue: vLit
//           };
//           if (hasText(u)) sub['sio:hasUnit'] = { '@value': String(u) };

//           mwSubAttrs.push(sub);
//         });

//         if (mwSubAttrs.length) {
//           componentAttrs.push({
//             id: `${componentId}/MolecularWeight`,
//             type: 'mm:MolecularWeight',
//             'hasAttribute': mwSubAttrs
//           });
//         }
//       }

//       // Density (Matrix -> Component -> Density (mcd))
//       const mcd = pick(mc, 'Density');
//       if (mcd) {
//         const desc = (pick(mcd, 'description') || '').toString().toLowerCase();
//         const v = pick(mcd, 'value');
//         const u = pick(mcd, 'unit');
//         const dLit = litNum(v);

//         if (dLit) {
//           componentAttrs.push({
//             id: `${componentId}/density`,
//             type: 'mm:Density',
//             ...(hasText(desc) && { 'rdfs:label': desc }),
//             hasValue: dLit,
//             ...(hasText(u) && { 'sio:hasUnit': { '@value': String(u) } })
//           });
//         }
//       }

//       // Viscosity (Matrix -> Component -> Viscosity (mcv))
//       const mcv = pick(mc, 'Viscosity');
//       if (mcv) {
//         const desc = (pick(mcv, 'description') || '').toString().toLowerCase();
//         const v =
//           pick(mcv, 'FixedValue.value.value') ??
//           pick(mcv, 'value.value') ??
//           pick(mcv, 'value');
//         const u =
//           pick(mcv, 'FixedValue.value.unit') ??
//           pick(mcv, 'value.unit') ??
//           pick(mcv, 'unit');
//         const vLit = litNum(v);

//         if (vLit || desc) {
//           componentAttrs.push({
//             id: `${componentId}/viscosity`,
//             type: 'mm:Viscosity',
//             ...(hasText(desc) && { 'rdfs:label': desc }),
//             ...(u && { hasValue: vLit }),
//             ...(hasText(u) && { 'sio:hasUnit': { '@value': String(u) } })
//           });
//         }
//       }

//       // Additive (Matrix -> Component -> Additive (mca))
//       const mca = pick(mc, 'Additive');
//       if (mca) {
//         const desc = (
//           pick(mca, 'description') ||
//           'Additional additives, e.g., catalyst, promoter'
//         )
//           .toString()
//           .toLowerCase();
//         const additive = (pick(mca, 'Additive') || '').toString().toLowerCase();
//         const v = pick(mcv, 'Amount.value') ?? pick(mcv, 'value');
//         const u = pick(mcv, 'Amount.unit') ?? pick(mcv, 'unit');
//         const aLit = litNum(v);

//         if (additive) {
//           const additiveNode = {
//             id: `${componentId}/Additive`,
//             type: 'mm:Additive',
//             'rdfs:label': desc,
//             hasValue: litStr(additive)
//           };

//           if (aLit) {
//             additiveNode['hasAttribute'] = [
//               {
//                 id: `${componentId}/Additive/Amount`,
//                 type: 'mm:AdditiveAmount',
//                 'rdfs:label': desc,
//                 ...(u && { hasValue: aLit }),
//                 ...(hasText(u) && { 'sio:hasUnit': { '@value': String(u) } })
//               }
//             ];
//           }
//           componentAttrs.push(additiveNode);
//         }
//       }

//       // Final component node
//       return {
//         id: componentId,
//         type: 'mm:MatrixComponent',
//         ...(componentAttrs.length ? { 'hasAttribute': componentAttrs } : {})
//       };
//     });

//     // Wrap under matrix_type, then materials attribute
//     const matrixDescription = pick(
//       pnc,
//       'PolymerNanocomposite.MATERIALS.Matrix.Description'
//     );
//     const matrixComponentNode = {
//       id: `${baseId}/matrix`,
//       type: 'mm:Matrix',
//       'rdfs:label': matrixDescription ?? 'Polymer matrix',
//       'hasAttribute': componentNodes
//     };

//     const materialsAttr = {
//       id: `${baseId}/attr/materials`,
//       type: 'sio:SIO_000198',
//       'rdfs:label': 'Material constituent charateristics',
//       'hasAttribute': [matrixComponentNode]
//     };

//     attrs.push(materialsAttr);
//   }

//   // -------------------------------------------------
//   // MICROSTRUCTURE
//   // -------------------------------------------------
//   const microLengthUnit = pick(
//     pnc,
//     'PolymerNanocomposite.MICROSTRUCTURE.LengthUnit'
//   );
//   const imageFile = asArray(
//     pick(pnc, 'PolymerNanocomposite.MICROSTRUCTURE.ImageFile')
//   );

//   if (imageFile.length) {
//     const imageNodes = imageFile
//       .map((img, idx) => {
//         const imgId =
//           idx === 0
//             ? `${baseId}/imagefile/1`
//             : `${baseId}/imagefile/${idx + 1}`;

//         const iAttrs = [];

//         // File (extract `id` if present; keep description as rdfs:label on the file node)
//         const fileVal = pick(img, 'File');
//         const fileIdOnly = extractBlobId(fileVal);
//         if (hasText(fileIdOnly)) {
//           const fileAttr = {
//             id: `${imgId}/file`,
//             type: 'sio:SIO_000396',
//             hasValue: litStr(fileIdOnly)
//           };
//           const fileDesc = pick(img, 'Description');
//           if (hasText(fileDesc)) fileAttr['rdfs:label'] = String(fileDesc);
//           iAttrs.push(fileAttr);
//         }

//         // MicroscopyType
//         const microscopyType = pick(img, 'MicroscopyType');
//         if (hasText(microscopyType)) {
//           iAttrs.push({
//             id: `${imgId}/microscopytype`,
//             type: 'mm:MicroscopyType',
//             hasValue: litStr(microscopyType)
//           });
//         }

//         // Type
//         const typeText = pick(img, 'Type');
//         if (hasText(typeText)) {
//           iAttrs.push({
//             id: `${imgId}/type`,
//             type: 'mm:Type',
//             hasValue: litStr(typeText)
//           });
//         }

//         // Dimension (width/height); apply LengthUnit if present at MICROSTRUCTURE level
//         const width = pick(img, 'Dimension.width');
//         const height = pick(img, 'Dimension.height');
//         const widthLit = litNum(width);
//         const heightLit = litNum(height);

//         const dimSubAttrs = [];
//         if (widthLit) {
//           const wAttr = {
//             id: `${imgId}/dimension/width`,
//             type: 'sio:SIO_000042',
//             hasValue: widthLit
//           };
//           if (hasText(microLengthUnit)) {
//             wAttr['sio:hasUnit'] = { '@value': String(microLengthUnit) };
//           }
//           dimSubAttrs.push(wAttr);
//         }

//         if (heightLit) {
//           const hAttr = {
//             id: `${imgId}/dimension/height`,
//             type: 'sio:SIO_000040',
//             hasValue: heightLit
//           };
//           if (hasText(microLengthUnit)) {
//             hAttr['sio:hasUnit'] = { '@value': String(microLengthUnit) };
//           }
//           dimSubAttrs.push(hAttr);
//         }

//         if (dimSubAttrs.length) {
//           iAttrs.push({
//             id: `${imgId}/dimension`,
//             type: 'mm:AspectRatio',
//             'hasAttribute': dimSubAttrs
//           });
//         }

//         // If nothing was captured for this image, skip creating an empty node
//         if (!iAttrs.length) return null;

//         return {
//           id: imgId,
//           type: 'mm:ImageFile',
//           'hasAttribute': iAttrs
//         };
//       })
//       .filter(Boolean);

//     if (imageNodes.length) {
//       const microstructureAttr = {
//         id: `${baseId}/attr/microstructure`,
//         type: 'mm:Microstructure',
//         'hasAttribute': imageNodes
//       };
//       attrs.push(microstructureAttr);
//     }
//   }

//   // -------------------------------------------------
//   // FILLER COMPONENTS
//   // -------------------------------------------------
//   const firstFiller = toArray(
//     pick(pnc, 'PolymerNanocomposite.MATERIALS.Filler.FillerComponent')
//   )[0];

//   const psize = firstFiller && pick(firstFiller, 'ParticleSize');
//   if (psize) {
//     attrs.push(
//       makeAttr({
//         typeIri: 'mm:ParticleSize',
//         label: 'Filler_ParticleSize',
//         value: pick(psize, 'value'),
//         unit: pick(psize, 'unit'),
//         baseId
//       })
//     );
//   }

//   const dens = firstFiller && pick(firstFiller, 'Density');
//   if (dens) {
//     attrs.push(
//       makeAttr({
//         typeIri: 'mm:FillerDensity',
//         label: 'Filler_Density',
//         value: pick(dens, 'value'),
//         unit: pick(dens, 'unit'),
//         baseId
//       })
//     );
//   }

//   const fillerVol = pick(
//     pnc,
//     'PolymerNanocomposite.MATERIALS.Filler.FillerComposition.volume'
//   );
//   if (fillerVol != null) {
//     attrs.push(
//       makeAttr({
//         typeIri: 'mm:FillerVolumeFraction',
//         label: 'Filler_VolumeFraction',
//         value: fillerVol,
//         unit: null,
//         baseId
//       })
//     );
//   }

//   const heatings = toArray(
//     pick(pnc, 'PolymerNanocomposite.PROCESSING.SolutionProcessing')
//   ).flatMap((sp) =>
//     asArray(pick(sp, 'ChooseParameter'))
//       .map((cp) => pick(cp, 'Heating'))
//       .filter(Boolean)
//   );
//   const heating = heatings[0];
//   if (heating) {
//     const t = pick(heating, 'Temperature');
//     if (t) {
//       attrs.push(
//         makeAttr({
//           typeIri: 'mm:ProcessingTemperature',
//           label: 'Processing_Temperature',
//           value: pick(t, 'value'),
//           unit: pick(t, 'unit'),
//           baseId
//         })
//       );
//     }
//     const time = pick(heating, 'Time');
//     if (time) {
//       attrs.push(
//         makeAttr({
//           typeIri: 'mm:ProcessingTime',
//           label: 'Processing_Time',
//           value: pick(time, 'value'),
//           unit: pick(time, 'unit'),
//           baseId
//         })
//       );
//     }
//   }

//   return attrs;
// }

function extractAttributes(pnc, baseId) {
  const attrs = [];

  // --- helpers (local) ---
  const litStr = (v) =>
    v == null ? null : { '@value': String(v), '@type': 'xsd:string' };
  const litNum = (v) => {
    if (v == null) return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? { '@value': n, '@type': 'xsd:double' } : null;
  };
  const asArray = (x) => (Array.isArray(x) ? x : x != null ? [x] : []);

  // -------------------------------------------------
  // Weibull
  // -------------------------------------------------
  const weibull = pick(
    pnc,
    'PolymerNanocomposite.PROPERTIES.Electrical.DielectricBreakdownStrength.WeibullParameter'
  );
  if (weibull && typeof weibull === 'object') {
    attrs.push(
      makeAttr({
        typeIri: 'mm:WeibullParameter',
        label: 'DielectricBreakdownStrength_WeibullParameter',
        value: pick(weibull, 'value'),
        unit: pick(weibull, 'unit'),
        baseId
      })
    );
  }

  // -------------------------------------------------
  // MATRIX COMPONENTS
  // -------------------------------------------------
  const matrix = asArray(
    pick(pnc, 'PolymerNanocomposite.MATERIALS.Matrix.MatrixComponent')
  );

  // We’ll accumulate Matrix-level attributes here so we can append MatrixProcessing later.
  const matrixSubAttrs = [];

  if (matrix.length) {
    const componentNodes = matrix.map((mc, idx) => {
      const componentId =
        idx === 0
          ? `${baseId}/MatrixComponents`
          : `${baseId}/MatrixComponents/${idx + 1}`;

      const componentAttrs = [];

      // ChemicalName
      const chemicalName = pick(mc, 'ChemicalName');
      if (hasText(chemicalName)) {
        componentAttrs.push({
          id: `${componentId}/ChemicalName`,
          type: 'mm:ChemicalName',
          hasValue: litStr(chemicalName)
        });
      }

      // Abbreviation
      const abbreviation = pick(mc, 'Abbreviation');
      if (hasText(abbreviation)) {
        componentAttrs.push({
          id: `${componentId}/Abbreviation`,
          type: 'mm:Abbreviation',
          hasValue: litStr(abbreviation)
        });
      }

      // ConstitutionalUnit
      const constitutionalUnit = pick(mc, 'ConstitutionalUnit');
      if (hasText(constitutionalUnit)) {
        componentAttrs.push({
          id: `${componentId}/ConstitutionalUnit`,
          type: 'mm:ConstitutionalUnit',
          hasValue: litStr(constitutionalUnit)
        });
      }

      // StdChemicalName
      const stdChemicalName = pick(mc, 'StdChemicalName');
      if (hasText(stdChemicalName)) {
        componentAttrs.push({
          id: `${componentId}/StdChemicalName`,
          type: 'mm:StdChemicalName',
          hasValue: litStr(stdChemicalName)
        });
      }

      // SMILES
      const smiles = pick(mc, 'SMILES');
      if (hasText(smiles)) {
        componentAttrs.push({
          id: `${componentId}/SMILES`,
          type: 'mm:SMILES',
          hasValue: litStr(smiles)
        });
      }

      // uSMILES (fix: guard against uSMILES, not constitutionalUnit)
      const uSMILES = pick(mc, 'uSMILES');
      if (hasText(uSMILES)) {
        componentAttrs.push({
          id: `${componentId}/uSMILES`,
          type: 'mm:uSMILES',
          hasValue: litStr(uSMILES)
        });
      }

      // PubChemRef
      const pubChemRef = pick(mc, 'PubChemRef');
      if (hasText(pubChemRef)) {
        componentAttrs.push({
          id: `${componentId}/PubChemRef`,
          type: 'mm:PubChemReference',
          hasValue: litStr(pubChemRef)
        });
      }

      // PolymerClass
      const polymerClass = pick(mc, 'PolymerClass');
      if (hasText(polymerClass)) {
        componentAttrs.push({
          id: `${componentId}/PolymerClass`,
          type: 'mm:PolymerClass',
          hasValue: litStr(polymerClass)
        });
      }

      // Hardener
      const hardener = pick(mc, 'Hardener');
      if (hasText(hardener)) {
        componentAttrs.push({
          id: `${componentId}/Hardener`,
          type: 'mm:Hardener',
          hasValue: litStr(hardener)
        });
      }

      // Tacticity
      const tacticity = pick(mc, 'Tacticity');
      if (hasText(tacticity)) {
        componentAttrs.push({
          id: `${componentId}/Tacticity`,
          type: 'mm:Tacticity',
          hasValue: litStr(tacticity)
        });
      }

      // PlasticType
      const plasticType = pick(mc, 'PlasticType');
      if (hasText(plasticType)) {
        componentAttrs.push({
          id: `${componentId}/PlasticType`,
          type: 'mm:Plastic',
          hasValue: litStr(plasticType)
        });
      }

      // PolymerType (label as requested)
      const polymerType = pick(mc, 'PolymerType');
      if (hasText(polymerType)) {
        componentAttrs.push({
          id: `${componentId}/PolymerType`,
          'rdfs:label': 'Type of polymer based on monomer characteristics',
          hasValue: litStr(polymerType)
        });
      }

      // ManufacturerName
      const manufacturer = pick(mc, 'ManufacturerName');
      if (hasText(manufacturer)) {
        componentAttrs.push({
          id: `${componentId}/ManufacturerName`,
          type: 'mm:ManufacturerOrSourceName',
          hasValue: litStr(manufacturer)
        });
      }

      // TradeName
      const tradeName = pick(mc, 'TradeName');
      if (hasText(tradeName)) {
        componentAttrs.push({
          id: `${componentId}/TradeName`,
          type: 'mm:TradeName',
          hasValue: litStr(tradeName)
        });
      }

      // Polydispersity
      const polydispersity = pick(mc, 'Polydispersity');
      const polyLit = litNum(polydispersity);
      if (polyLit) {
        componentAttrs.push({
          id: `${componentId}/Polydispersity`,
          type: 'mm:Polydispersity',
          hasValue: polyLit
        });
      }

      // MatrixComponentComposition → Constituent(s)
      const mcc = pick(mc, 'MatrixComponentComposition');
      if (mcc && typeof mcc === 'object') {
        const constituents = asArray(pick(mcc, 'Constituent')).filter(hasText);
        if (constituents.length) {
          const subAttrs = constituents.map((c, i) => ({
            id:
              i === 0
                ? `${componentId}/MatrixComponentComposition/Constituent`
                : `${componentId}/MatrixComponentComposition/Constituent/${
                    i + 1
                  }`,
            type: 'mm:Constituent',
            hasValue: litStr(c)
          }));
          componentAttrs.push({
            id: `${componentId}/MatrixComponentComposition`,
            type: 'mm:MatrixComponentComposition',
            hasAttribute: subAttrs
          });
        }
      }

      // MolecularWeight 1..n (default Mw when single & no description)
      const mws = asArray(pick(mc, 'MolecularWeight'));
      if (mws.length) {
        const mwSubAttrs = [];
        mws.forEach((mw, i) => {
          if (!mw || typeof mw !== 'object') return;
          const desc = (pick(mw, 'description') || '').toString().toLowerCase();

          let typeIri = null;
          if (desc.includes('number average')) {
            typeIri = 'mm:MolecularWeight_Mn';
          } else if (desc.includes('weight average')) {
            typeIri = 'mm:MolecularWeight_Mw';
          }
          if (
            !typeIri &&
            mws.length === 1 &&
            !hasText(pick(mw, 'description'))
          ) {
            typeIri = 'mm:MolecularWeight_Mw';
          }
          if (!typeIri) typeIri = 'mm:MolecularWeight_Mw';

          const v = pick(mw, 'value.value') ?? pick(mw, 'value');
          const u = pick(mw, 'value.unit') ?? pick(mw, 'unit');
          const vLit = litNum(v);
          if (!vLit) return;

          const sub = {
            id: `${componentId}/MolecularWeight/${i + 1}`,
            type: typeIri,
            hasValue: vLit
          };
          if (hasText(u)) sub['sio:hasUnit'] = { '@value': String(u) };
          mwSubAttrs.push(sub);
        });

        if (mwSubAttrs.length) {
          componentAttrs.push({
            id: `${componentId}/MolecularWeight`,
            type: 'mm:MolecularWeight',
            hasAttribute: mwSubAttrs
          });
        }
      }

      // Density
      const mcd = pick(mc, 'Density');
      if (mcd) {
        const desc = (pick(mcd, 'description') || '').toString();
        const v = pick(mcd, 'value');
        const u = pick(mcd, 'unit');
        const dLit = litNum(v);
        if (dLit) {
          componentAttrs.push({
            id: `${componentId}/Density`,
            type: 'mm:Density',
            ...(hasText(desc) && { 'rdfs:label': desc }),
            hasValue: dLit,
            ...(hasText(u) && { 'sio:hasUnit': { '@value': String(u) } })
          });
        }
      }

      // Viscosity (fix: hasValue conditional)
      const mcv = pick(mc, 'Viscosity');
      if (mcv) {
        const desc = (pick(mcv, 'description') || '').toString();
        const v =
          pick(mcv, 'FixedValue.value.value') ??
          pick(mcv, 'value.value') ??
          pick(mcv, 'value');
        const u =
          pick(mcv, 'FixedValue.value.unit') ??
          pick(mcv, 'value.unit') ??
          pick(mcv, 'unit');
        const vLit = litNum(v);

        if (vLit || hasText(desc)) {
          componentAttrs.push({
            id: `${componentId}/Viscosity`,
            type: 'mm:Viscosity',
            ...(hasText(desc) && { 'rdfs:label': desc }),
            ...(vLit && { hasValue: vLit }),
            ...(hasText(u) && { 'sio:hasUnit': { '@value': String(u) } })
          });
        }
      }

      // Additive (fix: use mca, correct hasValue conditional)
      const mca = pick(mc, 'Additive');
      if (mca) {
        const desc = (pick(mca, 'description') || '').toString();
        const additiveText = (pick(mca, 'Additive') || '').toString();
        const v = pick(mca, 'Amount.value') ?? pick(mca, 'value');
        const u = pick(mca, 'Amount.unit') ?? pick(mca, 'unit');
        const aLit = litNum(v);

        if (hasText(additiveText) || aLit) {
          const additiveNode = {
            id: `${componentId}/Additive`,
            type: 'mm:Additive',
            ...(hasText(desc) && { 'rdfs:label': desc }),
            ...(hasText(additiveText) && { hasValue: litStr(additiveText) })
          };
          if (aLit) {
            additiveNode.hasAttribute = [
              {
                id: `${componentId}/Additive/Amount`,
                type: 'mm:AdditiveAmount',
                ...(hasText(desc) && { 'rdfs:label': desc }),
                hasValue: aLit,
                ...(hasText(u) && { 'sio:hasUnit': { '@value': String(u) } })
              }
            ];
          }
          componentAttrs.push(additiveNode);
        }
      }

      return {
        id: componentId,
        type: 'mm:MatrixComponent',
        ...(componentAttrs.length ? { hasAttribute: componentAttrs } : {})
      };
    });

    matrixSubAttrs.push(...componentNodes);
  }

  // -------------------------------------------------
  // MATRIX PROCESSING
  // -------------------------------------------------
  // Build parameter nodes from Matrix.MatrixProcessing.ChooseParameter[*]
  const matrixProc = pick(
    pnc,
    'PolymerNanocomposite.MATERIALS.Matrix.MatrixProcessing'
  );
  const params = asArray(pick(matrixProc, 'ChooseParameter'));

  const buildCuringLike = (kindType, kindKey, obj, paramIdBase) => {
    if (!obj) return null;
    const nodeId = `${paramIdBase}`;
    const label = pick(obj, 'Description');
    const subAttrs = [];

    // Temperature
    const tVal = pick(obj, 'Temperature.value');
    if (tVal != null) {
      const tUnit = pick(obj, 'Temperature.unit');
      const tDesc = pick(obj, 'Temperature.description');
      const tLit = litNum(tVal);
      if (tLit) {
        subAttrs.push({
          id: `${baseId}/MatrixProcessing/${kindKey}/temperature`,
          type: 'mm:Heating',
          ...(hasText(tDesc) && { 'rdfs:label': tDesc }),
          hasValue: tLit,
          ...(hasText(tUnit) && { 'sio:hasUnit': { '@value': String(tUnit) } })
        });
      }
    }

    // Time
    const timeVal = pick(obj, 'Time.value');
    if (timeVal != null) {
      const timeUnit = pick(obj, 'Time.unit');
      const timeDesc = pick(obj, 'Time.description');
      const timeLit = litNum(timeVal);
      if (timeLit) {
        subAttrs.push({
          id: `${baseId}/MatrixProcessing/${kindKey}/time`,
          type: 'mm:ExposureTime',
          ...(hasText(timeDesc) && { 'rdfs:label': timeDesc }),
          hasValue: timeLit,
          ...(hasText(timeUnit) && {
            'sio:hasUnit': { '@value': String(timeUnit) }
          })
        });
      }
    }

    // Pressure
    const pVal = pick(obj, 'Pressure.value');
    if (pVal != null) {
      const pUnit = pick(obj, 'Pressure.unit');
      const pDesc = pick(obj, 'Pressure.description');
      const pLit = litNum(pVal);
      if (pLit) {
        subAttrs.push({
          id: `${baseId}/MatrixProcessing/${kindKey}/pressure`,
          type: 'mm:HotPressing',
          ...(hasText(pDesc) && { 'rdfs:label': pDesc }),
          hasValue: pLit,
          ...(hasText(pUnit) && { 'sio:hasUnit': { '@value': String(pUnit) } })
        });
      }
    }

    // AmbientCondition
    const ambient = pick(obj, 'AmbientCondition');
    if (hasText(ambient)) {
      subAttrs.push({
        id: `${baseId}/MatrixProcessing/${kindKey}/AmbientCondition`,
        type: 'mm:AmbientCondition',
        hasValue: litStr(ambient)
      });
    }

    if (!subAttrs.length && !hasText(label)) return null;
    return {
      id: nodeId,
      type: kindType,
      ...(hasText(label) && { 'rdfs:label': label }),
      ...(subAttrs.length ? { hasAttribute: subAttrs } : {})
    };
  };

  const buildAdditive = (add, paramIdBase) => {
    if (!add) return null;
    const label = pick(add, 'Description');
    const text = pick(add, 'Additive');
    const v = pick(add, 'Amount.value') ?? pick(add, 'value');
    const u = pick(add, 'Amount.unit') ?? pick(add, 'unit');
    const vLit = litNum(v);
    const node = {
      id: paramIdBase,
      type: 'mm:Additive',
      ...(hasText(label) && { 'rdfs:label': label }),
      ...(hasText(text) && { hasValue: litStr(text) })
    };
    if (vLit) {
      node.hasAttribute = [
        {
          id: `${paramIdBase}/Amount`,
          type: 'mm:AdditiveAmount',
          ...(hasText(label) && { 'rdfs:label': label }),
          hasValue: vLit,
          ...(hasText(u) && { 'sio:hasUnit': { '@value': String(u) } })
        }
      ];
    }
    if (!hasText(text) && !vLit) return hasText(label) ? node : null;
    return node;
  };

  const buildSolvent = (sol, paramIdBase) => {
    if (!sol) return null;
    const label = pick(sol, 'Description');
    const subAttrs = [];

    const sName = pick(sol, 'SolventName');
    if (hasText(sName)) {
      subAttrs.push({
        id: `${baseId}/MatrixProcessing/solvent/SolventName`,
        type: 'mm:SolventName',
        hasValue: litStr(sName)
      });
    }

    const sAmtVal = pick(sol, 'SolventAmount.value');
    if (sAmtVal != null) {
      const sAmtUnit = pick(sol, 'SolventAmount.unit');
      const sAmtDesc = pick(sol, 'SolventAmount.description');
      const sAmtLit = litNum(sAmtVal);
      if (sAmtLit) {
        subAttrs.push({
          id: `${baseId}/MatrixProcessing/solvent/SolventAmount`,
          type: 'mm:SolventAmount',
          ...(hasText(sAmtDesc) && { 'rdfs:label': sAmtDesc }),
          hasValue: sAmtLit,
          ...(hasText(sAmtUnit) && {
            'sio:hasUnit': { '@value': String(sAmtUnit) }
          })
        });
      }
    }

    if (!subAttrs.length && !hasText(label)) return null;
    return {
      id: paramIdBase,
      type: 'mm:Solvent',
      ...(hasText(label) && { 'rdfs:label': label }),
      ...(subAttrs.length ? { hasAttribute: subAttrs } : {})
    };
  };

  const buildMixing = (mix, paramIdBase) => {
    if (!mix) return null;
    const label = pick(mix, 'Description');
    const subAttrs = [];

    const mixer = pick(mix, 'Mixer');
    if (hasText(mixer)) {
      subAttrs.push({
        id: `${baseId}/MatrixProcessing/Mixing/Mixer`,
        type: 'mm:Mixer',
        hasValue: litStr(mixer)
      });
    }

    const method = pick(mix, 'MixingMethod');
    if (hasText(method)) {
      subAttrs.push({
        id: `${baseId}/MatrixProcessing/Mixing/MixingMethod`,
        type: 'mm:MixingMethod',
        hasValue: litStr(method)
      });
    }

    const chemicals = asArray(pick(mix, 'ChemicalUsed')).filter(hasText);
    chemicals.forEach((c, i) => {
      subAttrs.push({
        id:
          i === 0
            ? `${baseId}/MatrixProcessing/Mixing/ChemicalUsed`
            : `${baseId}/MatrixProcessing/Mixing/ChemicalUsed/${i + 1}`,
        type: 'mm:ChemicalUsed',
        hasValue: litStr(c)
      });
    });

    const rpmVal = pick(mix, 'RPM.value') ?? pick(mix, 'RPM'); // allow either
    if (rpmVal != null) {
      const rpmUnit = pick(mix, 'RPM.unit');
      const rpmDesc = pick(mix, 'RPM.description');
      const rpmLit = litNum(rpmVal);
      if (rpmLit) {
        subAttrs.push({
          id: `${baseId}/MatrixProcessing/Mixing/RPM`,
          type: 'mm:Rotation',
          ...(hasText(rpmDesc) && { 'rdfs:label': rpmDesc }),
          hasValue: rpmLit,
          ...(hasText(rpmUnit) && {
            'sio:hasUnit': { '@value': String(rpmUnit) }
          })
        });
      }
    }

    const timeVal = pick(mix, 'Time.value');
    if (timeVal != null) {
      const timeUnit = pick(mix, 'Time.unit');
      const timeDesc = pick(mix, 'Time.description');
      const tLit = litNum(timeVal);
      if (tLit) {
        subAttrs.push({
          id: `${baseId}/MatrixProcessing/Mixing/time`,
          type: 'mm:ExposureTime',
          ...(hasText(timeDesc) && { 'rdfs:label': timeDesc }),
          hasValue: tLit,
          ...(hasText(timeUnit) && {
            'sio:hasUnit': { '@value': String(timeUnit) }
          })
        });
      }
    }

    const tempVal = pick(mix, 'Temperature.value');
    if (tempVal != null) {
      const tempUnit = pick(mix, 'Temperature.unit');
      const tempDesc = pick(mix, 'Temperature.description');
      const tLit = litNum(tempVal);
      if (tLit) {
        subAttrs.push({
          id: `${baseId}/MatrixProcessing/Mixing/Temperature`,
          type: 'mm:Temperature',
          ...(hasText(tempDesc) && { 'rdfs:label': tempDesc }),
          hasValue: tLit,
          ...(hasText(tempUnit) && {
            'sio:hasUnit': { '@value': String(tempUnit) }
          })
        });
      }
    }

    if (!subAttrs.length && !hasText(label)) return null;
    return {
      id: paramIdBase,
      type: 'mm:Mixing',
      ...(hasText(label) && { 'rdfs:label': label }),
      ...(subAttrs.length ? { hasAttribute: subAttrs } : {})
    };
  };

  const buildMolding = (mold, paramIdBase) => {
    if (!mold) return null;
    const subAttrs = [];

    const mode = pick(mold, 'MoldingMode');
    if (hasText(mode)) {
      // map text to type
      const m = mode.toString().toLowerCase();
      let typeIri = 'mm:MoldingMode';
      if (m.includes('hot')) typeIri = 'mm:HotPressing';
      else if (m.includes('cast')) typeIri = 'mm:Casting';
      else if (m.includes('inject')) typeIri = 'mm:InjectionMolding';
      else if (m.includes('rotat')) typeIri = 'mm:RotationalMolding';
      else if (m.includes('vacuum')) typeIri = 'mm:VacuumMolding';

      subAttrs.push({
        id: `${baseId}/MatrixProcessing/Molding/MoldingMode`,
        type: typeIri,
        hasValue: litStr(mode)
      });
    }

    const info = pick(mold, 'MoldingInfo');
    if (info) {
      const infoNode = buildCuringLike(
        'mm:MoldingInfo',
        'Molding/MoldingInfo',
        info,
        `${paramIdBase}/MoldingInfo`
      );
      if (infoNode) subAttrs.push(infoNode);
    }

    if (!subAttrs.length) return null;
    return {
      id: paramIdBase,
      type: 'mm:Molding',
      hasAttribute: subAttrs
    };
  };

  const processingParamNodes = params
    .map((cp, i) => {
      const idx = i + 1;
      const paramId = `${baseId}/MatrixProcessing/parameter${idx}`;

      // Detect which child exists
      const curing = pick(cp, 'Curing');
      if (curing) {
        return buildCuringLike('mm:Curing', 'curing', curing, paramId);
      }

      const add = pick(cp, 'Additive');
      if (add) return buildAdditive(add, paramId);

      const sol = pick(cp, 'Solvent');
      if (sol) return buildSolvent(sol, paramId);

      const heating = pick(cp, 'Heating');
      if (heating) {
        return buildCuringLike('mm:Heating', 'heating', heating, paramId);
      }

      const cooling = pick(cp, 'Cooling');
      if (cooling) {
        return buildCuringLike('mm:Cooling', 'cooling', cooling, paramId);
      }

      // Hyphenated key: try both forms
      const drying =
        pick(cp, 'Drying-Evaporation') || (cp && cp['Drying-Evaporation']);
      if (drying) {
        return buildCuringLike(
          'mm:Drying-Evaporation',
          'Drying-Evaporation',
          drying,
          paramId
        );
      }

      const centrif = pick(cp, 'Centrifugation');
      if (hasText(centrif)) {
        return {
          id: paramId,
          type: 'mm:Centrifugation',
          hasValue: litStr(centrif)
        };
      }

      const molding = pick(cp, 'Molding');
      if (molding) return buildMolding(molding, paramId);

      const mixing = pick(cp, 'Mixing');
      if (mixing) return buildMixing(mixing, paramId);

      const other = pick(cp, 'Other');
      if (hasText(other)) {
        return {
          id: paramId,
          type: 'mm:Other',
          hasValue: litStr(other)
        };
      }

      return null; // unknown/no-op parameter
    })
    .filter(Boolean);

  if (processingParamNodes.length) {
    matrixSubAttrs.push({
      id: `${baseId}/MatrixProcessing`,
      type: 'mm:MatrixProcessing',
      hasAttribute: processingParamNodes
    });
  }

  // If we have at least matrix components or processing, emit Matrix + Materials wrapper
  if (matrixSubAttrs.length) {
    const matrixDescription = pick(
      pnc,
      'PolymerNanocomposite.MATERIALS.Matrix.Description'
    );

    const matrixNode = {
      id: `${baseId}/matrix`,
      type: 'mm:Matrix',
      ...(hasText(matrixDescription)
        ? { 'rdfs:label': matrixDescription }
        : { 'rdfs:label': 'Polymer matrix' }),
      hasAttribute: matrixSubAttrs
    };

    const materialsAttr = {
      id: `${baseId}/attr/materials`,
      type: 'sio:SIO_000198',
      'rdfs:label': 'Material constituent charateristics',
      hasAttribute: [matrixNode]
    };

    attrs.push(materialsAttr);
  }

  // -------------------------------------------------
  // MICROSTRUCTURE
  // -------------------------------------------------
  const microLengthUnit = pick(
    pnc,
    'PolymerNanocomposite.MICROSTRUCTURE.LengthUnit'
  );
  const imageFile = asArray(
    pick(pnc, 'PolymerNanocomposite.MICROSTRUCTURE.ImageFile')
  );

  if (imageFile.length) {
    const imageNodes = imageFile
      .map((img, idx) => {
        const imgId =
          idx === 0
            ? `${baseId}/imagefile/1`
            : `${baseId}/imagefile/${idx + 1}`;

        const iAttrs = [];

        const fileVal = pick(img, 'File');
        const fileIdOnly = extractBlobId(fileVal);
        if (hasText(fileIdOnly)) {
          const fileAttr = {
            id: `${imgId}/file`,
            type: 'sio:SIO_000396',
            hasValue: litStr(fileIdOnly)
          };
          const fileDesc = pick(img, 'Description');
          if (hasText(fileDesc)) fileAttr['rdfs:label'] = String(fileDesc);
          iAttrs.push(fileAttr);
        }

        const microscopyType = pick(img, 'MicroscopyType');
        if (hasText(microscopyType)) {
          iAttrs.push({
            id: `${imgId}/microscopytype`,
            type: 'mm:MicroscopyType',
            hasValue: litStr(microscopyType)
          });
        }

        const typeText = pick(img, 'Type');
        if (hasText(typeText)) {
          iAttrs.push({
            id: `${imgId}/type`,
            type: 'mm:Type',
            hasValue: litStr(typeText)
          });
        }

        const width = pick(img, 'Dimension.width');
        const height = pick(img, 'Dimension.height');
        const widthLit = litNum(width);
        const heightLit = litNum(height);

        const dimSubAttrs = [];
        if (widthLit) {
          const wAttr = {
            id: `${imgId}/dimension/width`,
            type: 'sio:SIO_000042',
            hasValue: widthLit
          };
          if (hasText(microLengthUnit)) {
            wAttr['sio:hasUnit'] = { '@value': String(microLengthUnit) };
          }
          dimSubAttrs.push(wAttr);
        }
        if (heightLit) {
          const hAttr = {
            id: `${imgId}/dimension/height`,
            type: 'sio:SIO_000040',
            hasValue: heightLit
          };
          if (hasText(microLengthUnit)) {
            hAttr['sio:hasUnit'] = { '@value': String(microLengthUnit) };
          }
          dimSubAttrs.push(hAttr);
        }
        if (dimSubAttrs.length) {
          iAttrs.push({
            id: `${imgId}/dimension`,
            type: 'mm:AspectRatio',
            hasAttribute: dimSubAttrs
          });
        }

        if (!iAttrs.length) return null;
        return {
          id: imgId,
          type: 'mm:ImageFile',
          hasAttribute: iAttrs
        };
      })
      .filter(Boolean);

    if (imageNodes.length) {
      attrs.push({
        id: `${baseId}/attr/microstructure`,
        type: 'mm:Microstructure',
        hasAttribute: imageNodes
      });
    }
  }

  // -------------------------------------------------
  // FILLER COMPONENTS
  // -------------------------------------------------
  const firstFiller = asArray(
    pick(pnc, 'PolymerNanocomposite.MATERIALS.Filler.FillerComponent')
  )[0];

  const psize = firstFiller && pick(firstFiller, 'ParticleSize');
  if (psize) {
    attrs.push(
      makeAttr({
        typeIri: 'mm:ParticleSize',
        label: 'Filler_ParticleSize',
        value: pick(psize, 'value'),
        unit: pick(psize, 'unit'),
        baseId
      })
    );
  }

  const dens = firstFiller && pick(firstFiller, 'Density');
  if (dens) {
    attrs.push(
      makeAttr({
        typeIri: 'mm:FillerDensity',
        label: 'Filler_Density',
        value: pick(dens, 'value'),
        unit: pick(dens, 'unit'),
        baseId
      })
    );
  }

  const fillerVol = pick(
    pnc,
    'PolymerNanocomposite.MATERIALS.Filler.FillerComposition.volume'
  );
  if (fillerVol != null) {
    attrs.push(
      makeAttr({
        typeIri: 'mm:FillerVolumeFraction',
        label: 'Filler_VolumeFraction',
        value: fillerVol,
        unit: null,
        baseId
      })
    );
  }

  const heatings = asArray(
    pick(pnc, 'PolymerNanocomposite.PROCESSING.SolutionProcessing')
  ).flatMap((sp) =>
    asArray(pick(sp, 'ChooseParameter'))
      .map((cp) => pick(cp, 'Heating'))
      .filter(Boolean)
  );
  const heating = heatings[0];
  if (heating) {
    const t = pick(heating, 'Temperature');
    if (t) {
      attrs.push(
        makeAttr({
          typeIri: 'mm:ProcessingTemperature',
          label: 'Processing_Temperature',
          value: pick(t, 'value'),
          unit: pick(t, 'unit'),
          baseId
        })
      );
    }
    const time = pick(heating, 'Time');
    if (time) {
      attrs.push(
        makeAttr({
          typeIri: 'mm:ProcessingTime',
          label: 'Processing_Time',
          value: pick(time, 'value'),
          unit: pick(time, 'unit'),
          baseId
        })
      );
    }
  }

  return attrs;
}

function extractDielectricDataset(pnc, baseId) {
  const ac = pick(
    pnc,
    'PolymerNanocomposite.PROPERTIES.Electrical.AC_DielectricDispersion'
  );
  if (!ac) return null;
  const epsilon = pick(ac, 'AC_Dielectric_Constant.data');
  const loss = pick(ac, 'Dielectric_Loss_Tangent.data');

  function rowsToPoints(data, dsId, xName, yName) {
    if (!data) return [];
    const rows = toArray(pick(data, 'rows.row'));
    return rows.map((r) => {
      const rid = String(r.$?.id || r['@_id'] || r.id || '');
      const cols = toArray(r.column);
      const c0 =
        cols.find((c) => c.$?.id === '0' || c['@_id'] === '0')?._ ??
        cols[0]?._ ??
        cols[0];
      const c1 =
        cols.find((c) => c.$?.id === '1' || c['@_id'] === '1')?._ ??
        cols[1]?._ ??
        cols[1];
      return {
        id: `${dsId}/point/${rid || Math.random().toString(36).slice(2)}`,
        type: 'mm:DataPoint',
        'mm:frequencyHz': asDecimal(c0),
        'mm:value': asDecimal(c1),
        'rdfs:label': `${xName}=${c0}, ${yName}=${c1}`
      };
    });
  }

  const dsIdEps = `${baseId}/dataset/epsilon`;
  const dsIdTan = `${baseId}/dataset/tanDelta`;

  const ptsEps = rowsToPoints(
    epsilon,
    dsIdEps,
    'frequency (Hz)',
    'dielectric constant'
  );
  const ptsTan = rowsToPoints(
    loss,
    dsIdTan,
    'frequency (Hz)',
    'dissipation factor'
  );

  if (!ptsEps.length && !ptsTan.length) return null;

  const datasets = [];
  if (ptsEps.length) {
    datasets.push({
      id: dsIdEps,
      type: 'mm:Dataset',
      'mm:hasPoint': ptsEps.map((p) => p.id)
    });
  }
  if (ptsTan.length) {
    datasets.push({
      id: dsIdTan,
      type: 'mm:Dataset',
      'mm:hasPoint': ptsTan.map((p) => p.id)
    });
  }

  return { datasets, points: [...ptsEps, ...ptsTan] };
}

/* ------------------------ Transform: XML(JS) → Nanopub JSON-LD ------------------------ */
async function transformXmlToNanopub(xmlObj, logger) {
  const pnc = xmlObj;
  const id =
    pick(pnc, 'PolymerNanocomposite.ID') ||
    pick(pnc, 'PolymerNanocomposite.Id') ||
    pick(pnc, 'PolymerNanocomposite.id');
  if (!id) throw new Error('Missing required <ID> element in XML.');

  const npId = `${NP_BASE}${encodeURIComponent(String(id))}`;
  const baseId = `${MM_BASE}pnc/${encodeURIComponent(String(id))}`;

  const common =
    pick(pnc, 'PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields') || {};
  const { article, authors } = await buildArticle(common, logger);

  const attrs = extractAttributes(pnc, baseId);
  const sample = {
    id: baseId,
    type: 'mm:MaterialSample',
    name: String(id),
    // hasAttribute: attrs.map((a) => a.id),
    hasAttribute: attrs
      .map((a) => (typeof a === 'string' ? a : a.id || a['@id']))
      .filter(Boolean),
    'schema:citation': article.id
  };

  const ds = extractDielectricDataset(pnc, baseId);

  const now = new Date().toISOString();
  const assertionId = `${npId}#assertion`;
  const provId = `${npId}#provenance`;
  const pubinfoId = `${npId}#pubinfo`;
  const headId = `${npId}#head`;

  const doc = {
    '@context': CONTEXT,
    id: npId,
    type: 'np:Nanopublication',
    hasAssertion: assertionId,
    hasProvenance: provId,
    hasPublicationInfo: pubinfoId,
    '@graph': [
      {
        id: assertionId,
        type: 'np:Assertion',
        '@graph': [
          sample,
          article,
          ...authors,
          ...attrs,
          ...(ds ? ds.datasets : []),
          ...(ds ? ds.points : [])
        ]
      },
      {
        id: provId,
        type: 'np:Provenance',
        '@graph': [
          {
            id: assertionId,
            wasDerivedFrom: article.id,
            wasAttributedTo: authors[0]?.id || `${MM_BASE}agent/unknown`
          }
        ]
      },
      {
        id: pubinfoId,
        type: 'np:PublicationInfo',
        '@graph': [
          {
            id: npId,
            creator: authors[0]?.id || `${MM_BASE}agent/nm-etl`,
            created: now
          }
        ]
      },
      {
        id: headId,
        type: 'np:Head',
        '@graph': [
          {
            id: npId,
            hasAssertion: assertionId,
            hasProvenance: provId,
            hasPublicationInfo: pubinfoId
          }
        ]
      }
    ]
  };

  return { nanopubId: id, nanopub: doc, assertionId };
}

/* ------------------------ Serialize ------------------------ */
async function toJsonLd(nanopub) {
  const compact = await jsonld.compact(nanopub, CONTEXT, {
    compactArrays: true
  });
  return JSON.stringify(compact, null, 2);
}

async function toTurtleAssertionOnly(nanopub, assertionId) {
  const nquads = await jsonld.toRDF(nanopub, { format: 'application/n-quads' });
  const writer = new Writer({
    prefixes: {
      mm: MM_BASE,
      schema: 'http://schema.org/',
      sio: 'http://semanticscience.org/resource/',
      prov: 'http://www.w3.org/ns/prov#',
      dct: 'http://purl.org/dc/terms/',
      unit: 'http://qudt.org/vocab/unit/',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      xsd: 'http://www.w3.org/2001/XMLSchema#'
    }
  });
  const lines = nquads.split('\n').filter(Boolean);
  for (const line of lines) {
    // <s> <p> <o> <g> .
    const m = line.match(/^(<[^>]+>)\s+(<[^>]+>)\s+(.+?)\s+(<[^>]+>)\s*\.\s*$/);
    if (!m) continue;
    const [, s, p, o, g] = m;
    if (g !== `<${assertionId}>`) continue;

    const sTerm = namedNode(s.slice(1, -1));
    const pTerm = namedNode(p.slice(1, -1));
    let oTerm;
    if (o.startsWith('<')) oTerm = namedNode(o.slice(1, -1));
    else {
      const litMatch = o.match(
        /^"([\s\S]*)"(?:\^\^<([^>]+)>|@([a-zA-Z\-]+))?$/
      );
      if (!litMatch) continue;
      const [, lex, dtype, lang] = litMatch;
      oTerm = literal(lex, dtype ? namedNode(dtype) : lang || null);
    }
    writer.addQuad(quad(sTerm, pTerm, oTerm));
  }
  return new Promise((resolve, reject) =>
    writer.end((err, ttl) => (err ? reject(err) : resolve(ttl)))
  );
}

async function toTriG(nanopub) {
  // Full nanopublication (Head/Assertion/Provenance/PublicationInfo) as TriG
  const nquads = await jsonld.toRDF(nanopub, { format: 'application/n-quads' });
  const writer = new Writer({
    format: 'application/trig',
    prefixes: {
      mm: MM_BASE,
      schema: 'http://schema.org/',
      sio: 'http://semanticscience.org/resource/',
      prov: 'http://www.w3.org/ns/prov#',
      dct: 'http://purl.org/dc/terms/',
      unit: 'http://qudt.org/vocab/unit/',
      np: 'http://www.nanopub.org/nschema#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      xsd: 'http://www.w3.org/2001/XMLSchema#'
    }
  });

  const lines = nquads.split('\n').filter(Boolean);
  for (const line of lines) {
    // <s> <p> <o> <g> .
    const m = line.match(/^(<[^>]+>)\s+(<[^>]+>)\s+(.+?)\s+(<[^>]+>)\s*\.\s*$/);
    if (!m) continue;
    const [, s, p, o, g] = m;

    const sTerm = namedNode(s.slice(1, -1));
    const pTerm = namedNode(p.slice(1, -1));
    let oTerm;
    if (o.startsWith('<')) oTerm = namedNode(o.slice(1, -1));
    else {
      const litMatch = o.match(
        /^"([\s\S]*)"(?:\^\^<([^>]+)>|@([a-zA-Z\-]+))?$/
      );
      if (!litMatch) continue;
      const [, lex, dtype, lang] = litMatch;
      oTerm = literal(lex, dtype ? namedNode(dtype) : lang || null);
    }
    const gTerm = namedNode(g.slice(1, -1));
    writer.addQuad(quad(sTerm, pTerm, oTerm, gTerm));
  }
  return new Promise((resolve, reject) =>
    writer.end((err, trig) => (err ? reject(err) : resolve(trig)))
  );
}

/* ------------------------ SHACL validation via ManagedServices ------------------------ */
async function validateWithSHACL({
  data,
  format, // 'json-ld' | 'trig' | 'turtle'
  inference = 'rdfs',
  resolveUrls = false,
  ontologyLink,
  req,
  res,
  next
}) {
  const sanitized = prepareForValidation(data);
  const dataText = JSON.stringify(sanitized);
  const body = {
    validation_type: 'ontology+data',
    data_text: dataText,
    data_format: format,
    inference,
    resolve_urls: resolveUrls,
    persist: true
  };
  if (ontologyLink) body.ontology_link = ontologyLink;

  const request = {
    ...req,
    method: 'POST',
    url: 'mn/validate-ontology',
    body,
    params: { appName: 'validate-ontology' },
    isBackendCall: true
  };

  const r = await manageServiceRequest(request, res, next);
  return r;
}

function calculateTotal(input) {
  let sum = 0;

  for (const item of input) {
    if (
      Array.isArray(item) &&
      item.length >= 2 &&
      typeof item[1] === 'number'
    ) {
      sum += item[1];
    }
  }

  return sum - input.length;
}

async function publishToChangeLog(
  { resp, id, failed, sampleIdForFailure },
  req,
  res,
  next,
  cb
) {
  try {
    const request = {
      ...req,
      method: 'POST',
      body: {
        change: [
          `${calculateTotal(
            resp?.persistence?.graphs_preview || []
          )} Triples added`
        ],
        resourceId: id,
        published: true
      },
      isBackendCall: true
    };
    const r = await cb(request, res, next);
    return r;
  } catch (error) {
    failed.push({
      id,
      sampleID: sampleIdForFailure,
      stage: 'unexpected',
      errors: [String(error?.message || error)]
    });
  }
}

module.exports = {
  transformXmlToNanopub,
  toJsonLd,
  toTurtleAssertionOnly,
  toTriG,
  validateWithSHACL,
  publishToChangeLog
};
