/* eslint-disable camelcase */
/* eslint-disable space-before-function-paren */
const CH = require('./curation-utility'); // Curation Helper
const { MM_BASE, NP_BASE } = require('../../config/constant');
const jsonld = require('jsonld');
const {
  manageServiceRequest
} = require('../controllers/managedServiceController');
const { Writer, namedNode, literal, quad } = require('n3');

const {
  mapUnit,
  toArray,
  pick,
  slug,
  hasText,
  litStr,
  litNum,
  extractBlobId,
  extractBareDOI,
  toDoiIri,
  fetchPaperDetails,
  prepareForValidation
} = CH;

/** ---------- Output context ----------
 * - We emit sio:hasAttribute/hasValue/hasUnit explicitly.
 * - All nodes use @id / @type.
 */
const OUTPUT_CONTEXT = {
  mm: MM_BASE,
  schema: 'http://schema.org/',
  sio: 'http://semanticscience.org/resource/',
  prov: 'http://www.w3.org/ns/prov#',
  dct: 'http://purl.org/dc/terms/',
  dcat: 'http://www.w3.org/ns/dcat#',
  np: 'http://www.nanopub.org/nschema#',
  unit: 'http://qudt.org/vocab/unit/',
  pav: 'http://purl.org/pav/',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#'
};

/* ------------------------ Article/meta extraction (for prov/pubinfo) ------------------------ */
async function buildArticle(common, logger) {
  const xmlPublication = pick(common, 'Publication');
  const xmlDOI = pick(common, 'DOI');
  const xmlPublicationYear = pick(common, 'PublicationYear');
  const xmlAuthors = toArray(pick(common, 'Author'));
  const keywordsXml = toArray(pick(common, 'Keywords.Keyword')) || [];

  const doiBare = extractBareDOI(xmlDOI);
  const doiIri = toDoiIri(xmlDOI);

  const oa = doiBare ? await fetchPaperDetails(doiBare, logger) : null;

  // Authors (no limit)
  let authors = [];
  if (oa && Array.isArray(oa.authorships) && oa.authorships.length) {
    authors = oa.authorships.map((a, idx) => {
      const name =
        a?.author?.display_name || a?.raw_author_name || `author-${idx + 1}`;
      return { id: `${MM_BASE}agent/${slug(name)}`, name };
    });
  } else {
    authors = xmlAuthors.map((nameStr, idx) => {
      const name = String(nameStr || `author-${idx + 1}`);
      return { id: `${MM_BASE}agent/${slug(name)}`, name };
    });
  }

  const datePublished =
    (oa?.publication_date
      ? String(oa.publication_date).slice(0, 4)
      : undefined) ||
    xmlPublicationYear ||
    undefined;

  let keywords = [];
  if (Array.isArray(oa?.keywords) && oa.keywords.length) {
    keywords = oa.keywords.map((k) => k.display_name || k.id || String(k));
  } else if (Array.isArray(oa?.concepts) && oa.concepts.length) {
    keywords = oa.concepts.map((c) => c.display_name || c.id).filter(Boolean);
  } else {
    keywords = keywordsXml;
  }

  const relatedWorks = Array.isArray(oa?.related_works) ? oa.related_works : [];

  return {
    doiIri,
    datePublished,
    keywords,
    relatedWorks,
    authors // [{id, name}]
  };
}

/* ------------------------ Builders for Matrix & Processing ------------------------ */

/** Build a single MatrixComponent node with nested sio:hasAttribute. */
function buildMatrixComponent(mc, componentId) {
  const componentAttrs = [];

  const pushText = (key, typeIri, path) => {
    const v = pick(mc, path);
    if (hasText(v)) {
      componentAttrs.push({
        '@id': `${componentId}/${key}`,
        '@type': typeIri,
        'sio:hasValue': litStr(v)
      });
    }
  };

  pushText('ChemicalName', 'mm:ChemicalName', 'ChemicalName');
  pushText('Abbreviation', 'mm:Abbreviation', 'Abbreviation');
  pushText('ConstitutionalUnit', 'mm:ConstitutionalUnit', 'ConstitutionalUnit');
  pushText('StdChemicalName', 'mm:StdChemicalName', 'StdChemicalName');
  pushText('SMILES', 'mm:SMILES', 'SMILES');
  pushText('uSMILES', 'mm:uSMILES', 'uSMILES');
  pushText('PubChemRef', 'mm:PubChemReference', 'PubChemRef');
  pushText('PolymerClass', 'mm:PolymerClass', 'PolymerClass');
  pushText('Hardener', 'mm:Hardener', 'Hardener');
  pushText('Tacticity', 'mm:Tacticity', 'Tacticity');
  pushText('PlasticType', 'mm:Plastic', 'PlasticType');

  if (hasText(pick(mc, 'PolymerType'))) {
    componentAttrs.push({
      '@id': `${componentId}/PolymerType`,
      'rdfs:label': 'Type of polymer based on monomer characteristics',
      'sio:hasValue': litStr(pick(mc, 'PolymerType'))
    });
  }

  pushText(
    'ManufacturerName',
    'mm:ManufacturerOrSourceName',
    'ManufacturerName'
  );
  pushText('TradeName', 'mm:TradeName', 'TradeName');

  // MatrixComponentComposition → Constituent(s)
  const mcc = pick(mc, 'MatrixComponentComposition');
  if (mcc && typeof mcc === 'object') {
    const constituents = toArray(pick(mcc, 'Constituent')).filter(hasText);
    if (constituents.length) {
      const subAttrs = constituents.map((c, i) => ({
        '@id':
          i === 0
            ? `${componentId}/MatrixComponentComposition/Constituent`
            : `${componentId}/MatrixComponentComposition/Constituent/${i + 1}`,
        '@type': 'mm:Constituent',
        'sio:hasValue': litStr(c)
      }));
      componentAttrs.push({
        '@id': `${componentId}/MatrixComponentComposition`,
        '@type': 'mm:MatrixComponentComposition',
        'sio:hasAttribute': subAttrs
      });
    }
  }

  // MolecularWeight 1..n (numeric; unit optional)
  const mws = toArray(pick(mc, 'MolecularWeight'));
  if (mws.length) {
    const mwSubAttrs = [];
    mws.forEach((mw, i) => {
      if (!mw || typeof mw !== 'object') return;

      const desc = (pick(mw, 'description') || '').toString().toLowerCase();
      let typeIri = null;
      if (desc.includes('number average')) typeIri = 'mm:MolecularWeight_Mn';
      else if (desc.includes('weight average')) {
        typeIri = 'mm:MolecularWeight_Mw';
      }
      if (!typeIri && mws.length === 1 && !hasText(pick(mw, 'description'))) {
        typeIri = 'mm:MolecularWeight_Mw';
      }
      if (!typeIri) typeIri = 'mm:MolecularWeight_Mw';

      const v = pick(mw, 'value.value') ?? pick(mw, 'value');
      const u = pick(mw, 'value.unit') ?? pick(mw, 'unit');
      const vLit = litNum(v);
      if (!vLit) return;

      const unitIri = mapUnit(u);
      const sub = {
        '@id': `${componentId}/MolecularWeight/${i + 1}`,
        '@type': typeIri,
        'sio:hasValue': vLit
      };
      if (unitIri) sub['sio:hasUnit'] = unitIri;
      else if (hasText(u)) sub['sio:hasUnit'] = String(u);
      mwSubAttrs.push(sub);
    });

    if (mwSubAttrs.length) {
      componentAttrs.push({
        '@id': `${componentId}/MolecularWeight`,
        '@type': 'mm:MolecularWeight',
        'sio:hasAttribute': mwSubAttrs
      });
    }
  }

  // Density (numeric)
  const mcd = pick(mc, 'Density');
  if (mcd) {
    const desc = (pick(mcd, 'description') || '').toString();
    const v = pick(mcd, 'value');
    const u = pick(mcd, 'unit');
    const dLit = litNum(v);
    if (dLit || hasText(desc)) {
      const unitIri = mapUnit(u);
      const node = {
        '@id': `${componentId}/Density`,
        '@type': 'mm:Density',
        ...(hasText(desc) && { 'rdfs:comment': desc }),
        ...(dLit && { 'sio:hasValue': dLit })
      };
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(u)) node['sio:hasUnit'] = String(u);
      componentAttrs.push(node);
    }
  }

  // Viscosity
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
      const unitIri = mapUnit(u);
      const node = {
        '@id': `${componentId}/Viscosity`,
        '@type': 'mm:Viscosity',
        ...(hasText(desc) && { 'rdfs:label': desc }),
        ...(vLit && { 'sio:hasValue': vLit })
      };
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(u)) node['sio:hasUnit'] = String(u);
      componentAttrs.push(node);
    }
  }

  // Additive under MatrixComponent
  const mca = pick(mc, 'Additive');
  if (mca) {
    const desc = (pick(mca, 'description') || '').toString();
    const additiveText = (pick(mca, 'Additive') || '').toString();
    const v = pick(mca, 'Amount.value') ?? pick(mca, 'value');
    const u = pick(mca, 'Amount.unit') ?? pick(mca, 'unit');
    const aLit = litNum(v);
    const unitIri = mapUnit(u);

    if (hasText(additiveText) || aLit) {
      const additiveNode = {
        '@id': `${componentId}/Additive`,
        '@type': 'mm:Additive',
        ...(hasText(desc) && { 'rdfs:label': desc }),
        ...(hasText(additiveText) && { 'sio:hasValue': litStr(additiveText) })
      };
      if (aLit) {
        const amt = {
          '@id': `${componentId}/Additive/Amount`,
          '@type': 'mm:AdditiveAmount',
          ...(hasText(desc) && { 'rdfs:label': desc }),
          'sio:hasValue': aLit
        };
        if (unitIri) amt['sio:hasUnit'] = unitIri;
        else if (hasText(u)) amt['sio:hasUnit'] = String(u);
        additiveNode['sio:hasAttribute'] = [amt];
      }
      componentAttrs.push(additiveNode);
    }
  }

  return {
    '@id': componentId,
    '@type': 'mm:MatrixComponent',
    ...(componentAttrs.length ? { 'sio:hasAttribute': componentAttrs } : {})
  };
}

/** Build a "curing-like" parameter bundle (Temperature/Time/Pressure/Ambient). */
function buildCuringLike(kindType, kindKey, obj, baseId) {
  if (!obj) return null;
  const label = pick(obj, 'Description');
  const subAttrs = [];

  const addVTU = (key, typeIri) => {
    const vVal = pick(obj, `${key}.value`);
    if (vVal != null) {
      const u = pick(obj, `${key}.unit`);
      const desc = pick(obj, `${key}.description`);
      const vLit = litNum(vVal);
      if (vLit) {
        const unitIri = mapUnit(u);
        const node = {
          '@id': `${baseId}/${kindKey}/${key.toLowerCase()}`,
          '@type': typeIri,
          ...(hasText(desc) && { 'rdfs:comment': desc }),
          'sio:hasValue': vLit
        };
        if (unitIri) node['sio:hasUnit'] = unitIri;
        else if (hasText(u)) node['sio:hasUnit'] = String(u);
        subAttrs.push(node);
      }
    }
  };

  addVTU(
    'Temperature',
    kindType === 'mm:Heating' ? 'mm:Heating' : 'mm:Temperature'
  );
  addVTU('Time', 'mm:ExposureTime');
  addVTU('Pressure', 'mm:HotPressing');

  const ambient = pick(obj, 'AmbientCondition');
  if (hasText(ambient)) {
    subAttrs.push({
      '@id': `${baseId}/${kindKey}/AmbientCondition`,
      '@type': 'mm:AmbientCondition',
      'sio:hasValue': litStr(ambient)
    });
  }

  if (!subAttrs.length && !hasText(label)) return null;
  return {
    '@id': baseId,
    '@type': kindType,
    ...(hasText(label) && { 'rdfs:label': label }),
    ...(subAttrs.length ? { 'sio:hasAttribute': subAttrs } : {})
  };
}

/** Build Additive parameter node used under Processing parameter lists. */
function buildAdditiveParam(add, baseId) {
  if (!add) return null;
  const label = pick(add, 'Description');
  const text = pick(add, 'Additive');
  const v = pick(add, 'Amount.value') ?? pick(add, 'value');
  const u = pick(add, 'Amount.unit') ?? pick(add, 'unit');
  const vLit = litNum(v);
  const unitIri = mapUnit(u);

  const node = {
    '@id': baseId,
    '@type': 'mm:Additive',
    ...(hasText(label) && { 'rdfs:label': label }),
    ...(hasText(text) && { 'sio:hasValue': litStr(text) })
  };
  if (vLit) {
    const amt = {
      '@id': `${baseId}/Amount`,
      '@type': 'mm:AdditiveAmount',
      ...(hasText(label) && { 'rdfs:label': label }),
      'sio:hasValue': vLit
    };
    if (unitIri) amt['sio:hasUnit'] = unitIri;
    else if (hasText(u)) amt['sio:hasUnit'] = String(u);
    node['sio:hasAttribute'] = [amt];
  }
  if (!hasText(text) && !vLit) return hasText(label) ? node : null;
  return node;
}

/** Build Solvent parameter node under Processing. */
function buildSolventParam(sol, baseId) {
  if (!sol) return null;
  const label = pick(sol, 'Description');
  const subAttrs = [];

  const sName = pick(sol, 'SolventName');
  if (hasText(sName)) {
    subAttrs.push({
      '@id': `${baseId}/solvent/SolventName`,
      '@type': 'mm:SolventName',
      'sio:hasValue': litStr(sName)
    });
  }

  const sAmtVal = pick(sol, 'SolventAmount.value');
  if (sAmtVal != null) {
    const sAmtUnit = pick(sol, 'SolventAmount.unit');
    const sAmtDesc = pick(sol, 'SolventAmount.description');
    const sAmtLit = litNum(sAmtVal);
    if (sAmtLit) {
      const unitIri = mapUnit(sAmtUnit);
      const node = {
        '@id': `${baseId}/solvent/SolventAmount`,
        '@type': 'mm:SolventAmount',
        ...(hasText(sAmtDesc) && { 'rdfs:label': sAmtDesc }),
        'sio:hasValue': sAmtLit
      };
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(sAmtUnit)) node['sio:hasUnit'] = String(sAmtUnit);
      subAttrs.push(node);
    }
  }

  if (!subAttrs.length && !hasText(label)) return null;
  return {
    '@id': baseId,
    '@type': 'mm:Solvent',
    ...(hasText(label) && { 'rdfs:label': label }),
    ...(subAttrs.length ? { 'sio:hasAttribute': subAttrs } : {})
  };
}

/** FIX #1: Parameterize scope for Mixing IDs (MatrixProcessing vs FillerProcessing). */
function buildMixingParam(mix, baseId, rootBaseId, scope = 'MatrixProcessing') {
  if (!mix) return null;
  const label = pick(mix, 'Description');
  const subAttrs = [];

  const mixer = pick(mix, 'Mixer');
  if (hasText(mixer)) {
    subAttrs.push({
      '@id': `${rootBaseId}/${scope}/Mixing/Mixer`,
      '@type': 'mm:Mixer',
      'sio:hasValue': litStr(mixer)
    });
  }

  const method = pick(mix, 'MixingMethod');
  if (hasText(method)) {
    subAttrs.push({
      '@id': `${rootBaseId}/${scope}/Mixing/MixingMethod`,
      '@type': 'mm:MixingMethod',
      'sio:hasValue': litStr(method)
    });
  }

  const chemicals = toArray(
    pick(mix, 'ChemicalUsed.description') ?? pick(mix, 'ChemicalUsed')
  ).filter(hasText);
  chemicals.forEach((c, i) => {
    const ch = c?.description || c;
    subAttrs.push({
      '@id':
        i === 0
          ? `${rootBaseId}/${scope}/Mixing/ChemicalUsed`
          : `${rootBaseId}/${scope}/Mixing/ChemicalUsed/${i + 1}`,
      '@type': 'mm:ChemicalUsed',
      'sio:hasValue': litStr(ch)
    });
  });

  const rpmVal = pick(mix, 'RPM.value') ?? pick(mix, 'RPM');
  if (rpmVal != null) {
    const rpmUnit = pick(mix, 'RPM.unit');
    const rpmDesc = pick(mix, 'RPM.description');
    const rpmLit = litNum(rpmVal);
    if (rpmLit) {
      const unitIri = mapUnit(rpmUnit);
      const node = {
        '@id': `${rootBaseId}/${scope}/Mixing/RPM`,
        '@type': 'mm:RotationSpeed',
        ...(hasText(rpmDesc) && { 'rdfs:label': rpmDesc }),
        'sio:hasValue': rpmLit
      };
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(rpmUnit)) node['sio:hasUnit'] = String(rpmUnit);
      subAttrs.push(node);
    }
  }

  const timeVal = pick(mix, 'Time.value');
  if (timeVal != null) {
    const timeUnit = pick(mix, 'Time.unit');
    const timeDesc = pick(mix, 'Time.description');
    const tLit = litNum(timeVal);
    if (tLit) {
      const unitIri = mapUnit(timeUnit);
      const node = {
        '@id': `${rootBaseId}/${scope}/Mixing/time`,
        '@type': 'mm:ExposureTime',
        ...(hasText(timeDesc) && { 'rdfs:label': timeDesc }),
        'sio:hasValue': tLit
      };
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(timeUnit)) node['sio:hasUnit'] = String(timeUnit);
      subAttrs.push(node);
    }
  }

  const tempVal = pick(mix, 'Temperature.value');
  if (tempVal != null) {
    const tempUnit = pick(mix, 'Temperature.unit');
    const tempDesc = pick(mix, 'Temperature.description');
    const tLit = litNum(tempVal);
    if (tLit) {
      const unitIri = mapUnit(tempUnit);
      const node = {
        '@id': `${rootBaseId}/${scope}/Mixing/Temperature`,
        '@type': 'mm:Temperature',
        ...(hasText(tempDesc) && { 'rdfs:label': tempDesc }),
        'sio:hasValue': tLit
      };
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(tempUnit)) node['sio:hasUnit'] = String(tempUnit);
      subAttrs.push(node);
    }
  }

  if (!subAttrs.length && !hasText(label)) return null;
  return {
    '@id': baseId,
    '@type': 'mm:Mixing',
    ...(hasText(label) && { 'rdfs:label': label }),
    ...(subAttrs.length ? { 'sio:hasAttribute': subAttrs } : {})
  };
}

/** FIX #4: Extrusion parameter builder, shared by Matrix/Filler processing. */
function buildExtrusionParam(
  extrusion,
  baseId,
  rootBaseId,
  scope = 'MatrixProcessing'
) {
  if (!extrusion) return null;

  const twin = pick(extrusion, 'TwinScrewExtrusion');
  const single = pick(extrusion, 'SingleScrewExtrusion');
  const variant = twin
    ? 'TwinScrewExtrusion'
    : single
    ? 'SingleScrewExtrusion'
    : null;
  const nodeObj = twin || single;
  if (!variant || !nodeObj) return null;

  const attrs = [];
  const headerDesc = pick(extrusion, 'Description');
  const variantDesc = pick(nodeObj, 'Description');
  const label = headerDesc || variantDesc;

  // helpers
  const addVTU = (obj, key, typeIri, localName, isNumber = false) => {
    const vVal = pick(obj, `${key}.value`);
    const uVal = pick(obj, `${key}.unit`);
    const dVal = pick(obj, `${key}.description`);
    let valLit =
      vVal != null
        ? isNumber
          ? litNum(vVal)
          : litNum(vVal) || litStr(vVal)
        : null;
    // If still null (plain scalar), try direct value
    if (!valLit) {
      const raw = pick(obj, key);
      if (raw != null) {
        valLit = isNumber ? litNum(raw) : litNum(raw) || litStr(raw);
      }
    }
    if (!valLit) return;

    const idBase = `${rootBaseId}/${scope}/extrusion/${localName}`;
    const node = {
      '@id': idBase,
      '@type': typeIri,
      ...(hasText(dVal) && { 'rdfs:label': dVal }),
      'sio:hasValue': valLit
    };
    const unitIri = mapUnit(uVal);
    if (unitIri) node['sio:hasUnit'] = unitIri;
    else if (hasText(uVal)) node['sio:hasUnit'] = String(uVal);
    attrs.push(node);
  };

  // Fields available on both variants
  addVTU(nodeObj, 'Extruder', 'mm:Extruder', 'Extruder', false);
  addVTU(
    nodeObj,
    'ExtrusionTemperature',
    'mm:ExtrusionTemperature',
    'ExtrusionTemperature',
    false
  );
  addVTU(nodeObj, 'ResidenceTime', 'mm:ResidenceTime', 'ResidenceTime', false);
  addVTU(nodeObj, 'ScrewDiameter', 'mm:ScrewDiameter', 'ScrewDiameter', false);
  addVTU(nodeObj, 'D_L_ratio', 'mm:DLratio', 'D_L_ratio', true);
  addVTU(nodeObj, 'DieDiameter', 'mm:DieDiameter', 'DieDiameter', false);
  addVTU(nodeObj, 'RotationSpeed', 'mm:RotationSpeed', 'RotationSpeed', false);

  // Either RadialFlightClearance or FlightClearance
  const rfc = pick(nodeObj, 'RadialFlightClearance');
  const fc = pick(nodeObj, 'FlightClearance');
  if (rfc != null || fc != null) {
    const obj =
      rfc != null ? { RadialFlightClearance: rfc } : { FlightClearance: fc };
    addVTU(
      obj,
      Object.keys(obj)[0],
      'mm:FlightClearance',
      'RadialFlightClearance',
      false
    );
  }

  // Twin-only
  if (variant === 'TwinScrewExtrusion') {
    addVTU(
      nodeObj,
      'ScrewChannelDiameter',
      'mm:ScrewChannelDiameter',
      'ScrewChannelDiameter',
      false
    );

    const rotationMode = pick(nodeObj, 'RotationMode');
    if (hasText(rotationMode)) {
      attrs.push({
        '@id': `${rootBaseId}/${scope}/extrusion/RotationMode`,
        '@type': 'mm:RotationMode',
        'sio:hasValue': litStr(rotationMode)
      });
    }
  }

  // Single-only
  if (variant === 'SingleScrewExtrusion') {
    addVTU(
      nodeObj,
      'InnerBarrelDiameter',
      'mm:InnerBarrelDiameter',
      'InnerBarrelDiameter',
      false
    );
    addVTU(nodeObj, 'ScrewLength', 'mm:ScrewLength', 'ScrewLength', false);
    addVTU(nodeObj, 'FlightWidth', 'mm:FlightWidth', 'FlightWidth', false);
    addVTU(nodeObj, 'ChannelDepth', 'mm:ChannelDepth', 'ChannelDepth', false);
    addVTU(nodeObj, 'ScrewLead', 'mm:ScrewLead', 'ScrewLead', false);
    addVTU(
      nodeObj,
      'NumberOfChannelsPerScrew',
      'mm:ChannelsPerScrew',
      'NumberOfChannelsPerScrew',
      true
    );
    addVTU(
      nodeObj,
      'ScrewChannelWidth',
      'mm:ScrewChannelWidth',
      'ScrewChannelWidth',
      false
    );
    addVTU(
      nodeObj,
      'BarrelTemperature',
      'mm:BarrelTemperature',
      'BarrelTemperature',
      false
    );
  }

  // HeatingZone (nested)
  const heatingZones = toArray(pick(nodeObj, 'HeatingZone'));
  heatingZones.forEach((hz, i) => {
    const hzAttrs = [];
    const hzBase = `${rootBaseId}/${scope}/extrusion/HeatingZone${
      heatingZones.length > 1 ? `/${i + 1}` : ''
    }`;

    // BarrelTemperature
    const hzBarrel = pick(hz, 'barrelTemperature');
    if (hzBarrel != null) {
      const v = pick(hz, 'barrelTemperature.value') ?? hzBarrel;
      const u = pick(hz, 'barrelTemperature.unit');
      const d = pick(hz, 'barrelTemperature.description');
      const vLit = litNum(v) || litStr(v);
      if (vLit) {
        const node = {
          '@id': `${hzBase}/BarrelTemperature`,
          '@type': 'mm:BarrelTemperature',
          ...(hasText(d) && { 'rdfs:label': d }),
          'sio:hasValue': vLit
        };
        const unitIri = mapUnit(u);
        if (unitIri) node['sio:hasUnit'] = unitIri;
        else if (hasText(u)) node['sio:hasUnit'] = String(u);
        hzAttrs.push(node);
      }
    }

    // LengthOfHeatingZone
    const hzLen = pick(hz, 'lengthOfHeatingZone');
    if (hzLen != null) {
      const v = pick(hz, 'lengthOfHeatingZone.value') ?? hzLen;
      const u = pick(hz, 'lengthOfHeatingZone.unit');
      const d = pick(hz, 'lengthOfHeatingZone.description');
      const vLit = litNum(v) || litStr(v);
      if (vLit) {
        const node = {
          '@id': `${hzBase}/LengthOfHeatingZone`,
          '@type': 'mm:LengthOfHeatingZone',
          ...(hasText(d) && { 'rdfs:label': d }),
          'sio:hasValue': vLit
        };
        const unitIri = mapUnit(u);
        if (unitIri) node['sio:hasUnit'] = unitIri;
        else if (hasText(u)) node['sio:hasUnit'] = String(u);
        hzAttrs.push(node);
      }
    }

    // HeatingZoneNumber (numeric)
    const hzNum = pick(hz, 'heatingZoneNumber');
    if (hzNum != null) {
      const d = pick(hz, 'heatingZoneNumber.description');
      const vLit = litNum(hzNum) || litNum(pick(hz, 'heatingZoneNumber.value'));
      if (vLit) {
        hzAttrs.push({
          '@id': `${hzBase}/HeatingZoneNumber`,
          '@type': 'mm:HeatingZoneNumber',
          ...(hasText(d) && { 'rdfs:label': d }),
          'sio:hasValue': vLit
        });
      }
    }

    if (hzAttrs.length) {
      attrs.push({
        '@id': hzBase,
        '@type': 'mm:HeatingZone',
        'sio:hasAttribute': hzAttrs
      });
    }
  });

  // Output (nested)
  const outputs = toArray(pick(nodeObj, 'Output'));
  outputs.forEach((out, i) => {
    const outAttrs = [];
    const outBase = `${rootBaseId}/${scope}/extrusion/Output${
      outputs.length > 1 ? `/${i + 1}` : ''
    }`;

    const addOut = (field, typeIri, local) => {
      const v = pick(out, `${field}.value`) ?? pick(out, field);
      const u = pick(out, `${field}.unit`);
      const d = pick(out, `${field}.description`);
      const vLit = litNum(v) || litStr(v);
      if (!vLit) return;
      const node = {
        '@id': `${outBase}/${local}`,
        '@type': typeIri,
        ...(hasText(d) && { 'rdfs:label': d }),
        'sio:hasValue': vLit
      };
      const unitIri = mapUnit(u);
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(u)) node['sio:hasUnit'] = String(u);
      outAttrs.push(node);
    };

    addOut('MeltTemperature', 'mm:MeltTemperature', 'MeltTemperature');
    addOut('PressureAtDie', 'mm:PressureAtDie', 'PressureAtDie');
    addOut('Torque', 'mm:Torque', 'Torque');
    addOut('Amperage', 'mm:Amperage', 'Amperage');
    addOut('Voltage', 'mm:Voltage', 'Voltage');
    addOut('Power', 'mm:Power', 'Power');
    addOut('ThroughPut', 'mm:ThroughPut', 'ThroughPut');
    addOut('ResidenceTime', 'mm:ResidenceTime', 'ResidenceTime');

    if (outAttrs.length) {
      attrs.push({
        '@id': outBase,
        '@type': 'mm:Output',
        'sio:hasAttribute': outAttrs
      });
    }
  });

  const node = {
    '@id': baseId,
    '@type': 'mm:Extrusion',
    'sio:hasValue': litStr(variant),
    ...(hasText(label) && { 'rdfs:label': label }),
    ...(attrs.length ? { 'sio:hasAttribute': attrs } : {})
  };

  return node;
}

/** Build a MatrixProcessing node from Matrix.ChooseParameter[*] */
function buildMatrixProcessing(pnc, baseId) {
  const matrixProc = pick(
    pnc,
    'PolymerNanocomposite.MATERIALS.Matrix.MatrixProcessing'
  );
  const params = toArray(pick(matrixProc, 'ChooseParameter'));
  if (!params.length) return null;

  const paramNodes = params
    .map((cp, i) => {
      const idx = i + 1;
      const paramId = `${baseId}/MatrixProcessing/parameter${idx}`;

      const curing = pick(cp, 'Curing');
      if (curing) {
        return buildCuringLike('mm:Curing', 'curing', curing, paramId);
      }

      const add = pick(cp, 'Additive');
      if (add) return buildAdditiveParam(add, paramId);

      const sol = pick(cp, 'Solvent');
      if (sol) return buildSolventParam(sol, paramId);

      const heating = pick(cp, 'Heating');
      if (heating) {
        return buildCuringLike('mm:Heating', 'heating', heating, paramId);
      }

      const cooling = pick(cp, 'Cooling');
      if (cooling) {
        return buildCuringLike('mm:Cooling', 'cooling', cooling, paramId);
      }

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

      const extrusion = pick(cp, 'Extrusion');
      if (extrusion) {
        return buildExtrusionParam(
          extrusion,
          paramId,
          baseId,
          'MatrixProcessing'
        );
      }

      const centrif = pick(cp, 'Centrifugation');
      if (hasText(centrif)) {
        return {
          '@id': paramId,
          '@type': 'mm:Centrifugation',
          'sio:hasValue': litStr(centrif)
        };
      }

      const molding = pick(cp, 'Molding');
      if (molding) {
        // Keep minimal for now: mode + optional info via curing-like helper
        const subAttrs = [];
        const mode = pick(molding, 'MoldingMode');
        if (hasText(mode)) {
          const m = mode.toString().toLowerCase();
          let typeIri = 'mm:MoldingMode';
          if (m.includes('hot')) typeIri = 'mm:HotPressing';
          else if (m.includes('cast')) typeIri = 'mm:Casting';
          else if (m.includes('inject')) typeIri = 'mm:InjectionMolding';
          else if (m.includes('rotat')) typeIri = 'mm:RotationalMolding';
          else if (m.includes('vacuum')) typeIri = 'mm:VacuumMolding';

          subAttrs.push({
            '@id': `${baseId}/MatrixProcessing/Molding/MoldingMode`,
            '@type': typeIri,
            'sio:hasValue': litStr(mode)
          });
        }
        const info = pick(molding, 'MoldingInfo');
        if (info) {
          const infoNode = buildCuringLike(
            'mm:Molding',
            'Molding/MoldingInfo',
            info,
            `${paramId}/MoldingInfo`
          );
          if (infoNode) subAttrs.push(infoNode);
        }
        return subAttrs.length
          ? {
              '@id': paramId,
              '@type': 'mm:Molding',
              'sio:hasAttribute': subAttrs
            }
          : null;
      }

      const mixing = pick(cp, 'Mixing');
      if (mixing) {
        return buildMixingParam(mixing, paramId, baseId, 'MatrixProcessing');
      }

      const other = pick(cp, 'Other');
      if (hasText(other)) {
        return {
          '@id': paramId,
          '@type': 'mm:Other',
          'sio:hasValue': litStr(other)
        };
      }

      return null; // unknown/no-op
    })
    .filter(Boolean);

  if (!paramNodes.length) return null;

  return {
    '@id': `${baseId}/MatrixProcessing`,
    '@type': 'mm:MatrixProcessing',
    'sio:hasAttribute': paramNodes
  };
}

/** Build FillerProcessing analog using same parameter logic as MatrixProcessing. */
function buildFillerProcessing(pnc, baseId) {
  const fillerProc = pick(
    pnc,
    'PolymerNanocomposite.MATERIALS.Filler.FillerProcessing'
  );
  const params = toArray(pick(fillerProc, 'ChooseParameter'));
  if (!params.length) return null;

  const paramNodes = params
    .map((cp, i) => {
      const idx = i + 1;
      const paramId = `${baseId}/FillerProcessing/parameter${idx}`;

      const curing = pick(cp, 'Curing');
      if (curing) {
        return buildCuringLike('mm:Curing', 'curing', curing, paramId);
      }

      const add = pick(cp, 'Additive');
      if (add) return buildAdditiveParam(add, paramId);

      const sol = pick(cp, 'Solvent');
      if (sol) return buildSolventParam(sol, paramId);

      const heating = pick(cp, 'Heating');
      if (heating) {
        return buildCuringLike('mm:Heating', 'heating', heating, paramId);
      }

      const cooling = pick(cp, 'Cooling');
      if (cooling) {
        return buildCuringLike('mm:Cooling', 'cooling', cooling, paramId);
      }

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

      const extrusion = pick(cp, 'Extrusion');
      if (extrusion) {
        return buildExtrusionParam(
          extrusion,
          paramId,
          baseId,
          'FillerProcessing'
        );
      }

      const centrif = pick(cp, 'Centrifugation');
      if (hasText(centrif)) {
        return {
          '@id': paramId,
          '@type': 'mm:Centrifugation',
          'sio:hasValue': litStr(centrif)
        };
      }

      /** FIX #2: Mirror Molding handling for FillerProcessing. */
      const molding = pick(cp, 'Molding');
      if (molding) {
        const subAttrs = [];
        const mode = pick(molding, 'MoldingMode');
        if (hasText(mode)) {
          const m = mode.toString().toLowerCase();
          let typeIri = 'mm:MoldingMode';
          if (m.includes('hot')) typeIri = 'mm:HotPressing';
          else if (m.includes('cast')) typeIri = 'mm:Casting';
          else if (m.includes('inject')) typeIri = 'mm:InjectionMolding';
          else if (m.includes('rotat')) typeIri = 'mm:RotationalMolding';
          else if (m.includes('vacuum')) typeIri = 'mm:VacuumMolding';

          subAttrs.push({
            '@id': `${baseId}/FillerProcessing/Molding/MoldingMode`,
            '@type': typeIri,
            'sio:hasValue': litStr(mode)
          });
        }
        const info = pick(molding, 'MoldingInfo');
        if (info) {
          const infoNode = buildCuringLike(
            'mm:Molding',
            'Molding/MoldingInfo',
            info,
            `${paramId}/MoldingInfo`
          );
          if (infoNode) subAttrs.push(infoNode);
        }
        return subAttrs.length
          ? {
              '@id': paramId,
              '@type': 'mm:Molding',
              'sio:hasAttribute': subAttrs
            }
          : null;
      }

      const mixing = pick(cp, 'Mixing');
      if (mixing) {
        return buildMixingParam(mixing, paramId, baseId, 'FillerProcessing');
      }

      const other = pick(cp, 'Other');
      if (hasText(other)) {
        return {
          '@id': paramId,
          '@type': 'mm:Other',
          'sio:hasValue': litStr(other)
        };
      }

      return null;
    })
    .filter(Boolean);

  if (!paramNodes.length) return null;

  return {
    '@id': `${baseId}/FillerProcessing`,
    '@type': 'mm:FillerProcessing',
    'sio:hasAttribute': paramNodes
  };
}

/** Build FillerComposition under Filler. */
function buildFillerComposition(pnc, baseId) {
  const comp = pick(
    pnc,
    'PolymerNanocomposite.MATERIALS.Filler.FillerComposition'
  );
  if (!comp) return null;

  const attrs = [];
  const uniqId = (base) => {
    let id = base;
    let i = 2;
    while (attrs.some((a) => a['@id'] === id)) {
      id = `${base}/${i++}`;
    }
    return id;
  };

  // Constituent (text)
  const constituent = pick(comp, 'Constituent');
  if (hasText(constituent)) {
    attrs.push({
      '@id': `${baseId}/Filler/FillerComposition/Constituent`,
      '@type': 'mm:Constituent',
      'sio:hasValue': litStr(constituent)
    });
  }

  // Helper for numeric fraction fields — supports nested or direct value
  const addNum = (paths, idSuffix, typeIri) => {
    let v = null;
    let vsource = null;
    for (const p of paths) {
      vsource = pick(comp, `${p}.source`);
      const val = pick(comp, `${p}.value`);
      if (val != null) {
        v = val;
        break;
      }
      const direct = pick(comp, p);
      if (direct != null) {
        v = direct;
        break;
      }
    }
    const vLit = litNum(v);
    if (!vLit) return;
    const vsourceLit = litStr(vsource);

    const idBase = `${baseId}/Filler/FillerComposition/${idSuffix}`;
    attrs.push({
      '@id': uniqId(idBase),
      '@type': typeIri,
      'sio:hasValue': vLit,
      ...(vsourceLit && { 'prov:hadPrimarySource': vsourceLit })
    });
  };

  // Fraction → Mass / Volume OR direct Mass / Volume
  addNum(['Fraction.Mass', 'Mass'], 'MassFraction', 'mm:MassFraction');
  addNum(['Fraction.Volume', 'Volume'], 'VolumeFraction', 'mm:VolumeFraction');

  // NonAgglomerateFraction → Mass / Volume OR direct
  addNum(['NonAgglomerateFraction.Mass'], 'MassFraction', 'mm:MassFraction');
  addNum(
    ['NonAgglomerateFraction.Volume'],
    'VolumeFraction',
    'mm:VolumeFraction'
  );

  // NumberOfAgglomeration → Mass / Volume OR direct
  addNum(['NumberOfAgglomeration.Mass'], 'MassFraction', 'mm:MassFraction');
  addNum(
    ['NumberOfAgglomeration.Volume'],
    'VolumeFraction',
    'mm:VolumeFraction'
  );

  // AgglomerateFraction → Mass / Volume OR direct
  addNum(['AgglomerateFraction.Mass'], 'MassFraction', 'mm:MassFraction');
  addNum(['AgglomerateFraction.Volume'], 'VolumeFraction', 'mm:VolumeFraction');

  if (!attrs.length) return null;

  return {
    '@id': `${baseId}/FillerComposition`,
    '@type': 'mm:FillerComposition',
    'sio:hasAttribute': attrs
  };
}

/** Build FillerComponent node (single) from Filler.FillerComponent[*] */
function buildFillerComponent(fc, fcId, rootBaseId) {
  const attrs = [];

  const pushText = (localId, typeIri, v, attrbs = attrs) => {
    if (hasText(v)) {
      attrbs.push({
        '@id': `${fcId}/${localId}`,
        '@type': typeIri,
        'sio:hasValue': litStr(v)
      });
    }
  };

  // Simple text fields
  pushText('ChemicalName', 'mm:ChemicalName', pick(fc, 'ChemicalName'));
  pushText(
    'StdChemicalName',
    'mm:StdChemicalName',
    pick(fc, 'StdChemicalName')
  );
  pushText('PubChemRef', 'mm:PubChemReference', pick(fc, 'PubChemRef'));
  pushText('Abbreviation', 'mm:Abbreviation', pick(fc, 'Abbreviation'));
  pushText(
    'ManufacturerOrSourceName',
    'mm:ManufacturerOrSourceName',
    pick(fc, 'ManufacturerOrSourceName')
  );
  pushText('TradeName', 'mm:TradeName', pick(fc, 'TradeName'));

  // Density (+ uncertainty)
  const dens = pick(fc, 'Density');
  if (dens) {
    const desc = pick(dens, 'description');
    const v = pick(dens, 'value');
    const u = pick(dens, 'unit');
    const vLit = litNum(v) || litStr(v);
    if (
      vLit ||
      hasText(desc) ||
      hasText(pick(dens, 'uncertainty.type')) ||
      hasText(pick(dens, 'uncertainty.value'))
    ) {
      const node = {
        '@id': `${fcId}/Density`,
        '@type': 'mm:Density',
        ...(hasText(desc) && { 'rdfs:label': desc }),
        ...(vLit && { 'sio:hasValue': vLit })
      };
      const unitIri = mapUnit(u);
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(u)) node['sio:hasUnit'] = String(u);

      const ut = pick(dens, 'uncertainty.type');
      const uv = pick(dens, 'uncertainty.value');
      if (hasText(ut) || hasText(uv)) {
        node['mm:hasUncertainty'] = {
          '@type': 'mm:Type',
          ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
          ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
        };
      }
      attrs.push(node);
    }
  }

  // CrystalPhase (text)
  pushText('CrystalPhase', 'mm:CrystalPhase', pick(fc, 'CrystalPhase'));

  // SphericalParticleDiameter (+ uncertainty) — supports 1..n
  const spdList = toArray(pick(fc, 'SphericalParticleDiameter'));
  if (spdList.length) {
    spdList.forEach((spdItem, i) => {
      // Accept both object and scalar forms
      const v =
        pick(spdItem, 'value') != null ? pick(spdItem, 'value') : spdItem;
      const u = pick(spdItem, 'unit');
      const desc = pick(spdItem, 'description');
      const ut = pick(spdItem, 'uncertainty.type');
      const uv = pick(spdItem, 'uncertainty.value');

      const vLit = litNum(v) || litStr(v);
      if (!vLit && !hasText(ut) && !hasText(uv)) return;

      const idSuffix = spdList.length === 1 ? '' : `/${i + 1}`;
      const node = {
        '@id': `${fcId}/SphericalParticleDiameter${idSuffix}`,
        '@type': 'mm:SphericalParticleDiameter',
        ...(hasText(desc) && { 'rdfs:comment': String(desc) }),
        ...(vLit && { 'sio:hasValue': vLit })
      };

      const unitIri = mapUnit(u);
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(u)) node['sio:hasUnit'] = String(u);

      if (hasText(ut) || hasText(uv)) {
        node['mm:hasUncertainty'] = {
          '@type': 'mm:Type',
          ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
          ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
        };
      }

      attrs.push(node);
    });
  }

  // SurfaceArea → hasSpecific / hasTotal
  const sa = pick(fc, 'SurfaceArea');
  if (sa) {
    const saNode = {
      '@id': `${fcId}/SurfaceArea`,
      '@type': 'mm:FillerPhaseSurfaceArea'
    };
    const specDesc = pick(sa, 'specific.description');
    const specVal = pick(sa, 'specific.value');
    const specUnit = pick(sa, 'specific.unit');
    const specLit = litNum(specVal) || litStr(specVal);
    if (specLit || hasText(specDesc) || hasText(specUnit)) {
      const obj = {
        ...(hasText(specDesc) && { 'rdfs:label': specDesc }),
        ...(specLit && { 'sio:hasValue': specLit })
      };
      const unitIri = mapUnit(specUnit);
      if (unitIri) obj['sio:hasUnit'] = unitIri;
      else if (hasText(specUnit)) obj['sio:hasUnit'] = String(specUnit);
      saNode['mm:hasSpecific'] = obj;
    }

    const totDesc = pick(sa, 'total.description');
    const totVal = pick(sa, 'total.value');
    const totUnit = pick(sa, 'total.unit');
    const totLit = litNum(totVal) || litStr(totVal);
    if (totLit || hasText(totDesc) || hasText(totUnit)) {
      const obj = {
        ...(hasText(totDesc) && { 'rdfs:label': totDesc }),
        ...(totLit && { 'sio:hasValue': totLit })
      };
      const unitIri = mapUnit(totUnit);
      if (unitIri) obj['sio:hasUnit'] = unitIri;
      else if (hasText(totUnit)) obj['sio:hasUnit'] = String(totUnit);
      saNode['mm:hasTotal'] = obj;
    }

    if (saNode['mm:hasSpecific'] || saNode['mm:hasTotal']) {
      attrs.push(saNode);
    }
  }

  // ParticleAspectRatio (+ uncertainty)
  const par = pick(fc, 'ParticleAspectRatio');
  if (par) {
    const v = pick(par, 'value');
    const u = pick(par, 'unit');
    const vLit = litNum(v) || litStr(v);
    if (
      vLit ||
      hasText(pick(par, 'uncertainty.type')) ||
      hasText(pick(par, 'uncertainty.value'))
    ) {
      const node = {
        '@id': `${fcId}/ParticleAspectRatio`,
        '@type': 'mm:AspectRatio',
        ...(vLit && { 'sio:hasValue': vLit })
      };
      const unitIri = mapUnit(u);
      if (unitIri) node['sio:hasUnit'] = unitIri;
      else if (hasText(u)) node['sio:hasUnit'] = String(u);

      const ut = pick(par, 'uncertainty.type');
      const uv = pick(par, 'uncertainty.value');
      if (hasText(ut) || hasText(uv)) {
        node['mm:hasUncertainty'] = {
          '@type': 'mm:Type',
          ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
          ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
        };
      }
      attrs.push(node);
    }
  }

  // NonSphericalShape → hasWidth/hasLength/hasDepth (+ uncertainties). No @id on sub-objects per your structure.
  const nss = pick(fc, 'NonSphericalShape');
  if (nss) {
    const nssNode = {
      '@id': `${fcId}/NonSphericalShape`,
      '@type': 'mm:NonSpherical'
    };
    const mkDim = (key, propKey) => {
      const v = pick(nss, `${key}.value`) ?? pick(nss, key);
      const u = pick(nss, `${key}.unit`);
      const ut = pick(nss, `${key}.uncertainty.type`);
      const uv = pick(nss, `${key}.uncertainty.value`);
      const vLit = litNum(v) || litStr(v);
      if (!vLit && !hasText(u) && !hasText(ut) && !hasText(uv)) return;

      const obj = {
        ...(vLit && { 'sio:hasValue': vLit })
      };
      const unitIri = mapUnit(u);
      if (unitIri) obj['sio:hasUnit'] = unitIri;
      else if (hasText(u)) obj['sio:hasUnit'] = String(u);

      if (hasText(ut) || hasText(uv)) {
        obj['mm:hasUncertainty'] = {
          '@type': 'mm:Type',
          ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
          ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
        };
      }
      nssNode[propKey] = obj;
    };
    mkDim('Width', 'mm:hasWidth');
    mkDim('Length', 'mm:hasLength');
    mkDim('Depth', 'mm:hasDepth');

    if (
      nssNode['mm:hasWidth'] ||
      nssNode['mm:hasLength'] ||
      nssNode['mm:hasDepth']
    ) {
      attrs.push(nssNode);
    }
  }

  // FillerComponentComposition (Mass / Volume)
  const fcc = pick(fc, 'FillerComponentComposition');
  if (fcc) {
    const sub = [];
    const mv = pick(fcc, 'Mass');
    const mLit = litNum(mv) || litNum(pick(fcc, 'Mass.value'));
    if (mLit) {
      sub.push({
        '@id': `${fcId}/FillerComponent/FillerComponentComposition/Mass`,
        '@type': 'mm:MassFraction',
        'sio:hasValue': mLit
      });
    }
    const vv = pick(fcc, 'Volume');
    const vLit = litNum(vv) || litNum(pick(fcc, 'Volume.value'));
    if (vLit) {
      sub.push({
        '@id': `${fcId}/FillerComponent/FillerComponentComposition/Volume`,
        '@type': 'mm:VolumeFraction',
        'sio:hasValue': vLit
      });
    }
    if (sub.length) {
      attrs.push({
        '@id': `${fcId}/FillerComponent/FillerComponentComposition`,
        '@type': 'mm:FillerComponentComposition',
        'sio:hasAttribute': sub
      });
    }
  }

  // FillerComponentInComposite (Mass / Volume)
  const fcic = pick(fc, 'FillerComponentInComposite');
  if (fcic) {
    const sub = [];
    const mv = pick(fcic, 'Mass');
    const mLit = litNum(mv) || litNum(pick(fcic, 'Mass.value'));
    if (mLit) {
      sub.push({
        '@id': `${fcId}/FillerComponent/FillerComponentInComposite/Mass`,
        '@type': 'mm:MassFraction',
        'sio:hasValue': mLit
      });
    }
    const vv = pick(fcic, 'Volume');
    const vLit = litNum(vv) || litNum(pick(fcic, 'Volume.value'));
    if (vLit) {
      sub.push({
        '@id': `${fcId}/FillerComponent/FillerComponentInComposite/Volume`,
        '@type': 'mm:VolumeFraction',
        'sio:hasValue': vLit
      });
    }
    if (sub.length) {
      attrs.push({
        '@id': `${fcId}/FillerComponent/FillerComponentInComposite`,
        '@type': 'mm:FillerComponentInComposite',
        'sio:hasAttribute': sub
      });
    }
  }

  // ParticleSurfaceTreatment (+ nested pieces) — supports 1..n
  const pstList = toArray(pick(fc, 'ParticleSurfaceTreatment'));
  if (pstList.length) {
    pstList.forEach((pst, i) => {
      const pstBase =
        pstList.length === 1
          ? `${fcId}/ParticleSurfaceTreatment`
          : `${fcId}/ParticleSurfaceTreatment/${i + 1}`;

      const pstAttrs = [];
      const pstText = (name, typeIri, value) => {
        if (hasText(value)) {
          pstAttrs.push({
            '@id': `${pstBase}/${name}`,
            '@type': typeIri,
            'sio:hasValue': litStr(value)
          });
        }
      };

      // Simple text fields
      pstText('ChemicalName', 'mm:ChemicalName', pick(pst, 'ChemicalName'));
      pstText('Abbreviation', 'mm:Abbreviation', pick(pst, 'Abbreviation'));
      pstText(
        'ManufacturerOrSourceName',
        'mm:ManufacturerOrSourceName',
        pick(pst, 'ManufacturerOrSourceName')
      );
      pstText(
        'ConstitutionalUnit',
        'mm:ConstitutionalUnit',
        pick(pst, 'ConstitutionalUnit')
      );
      pstText('TradeName', 'mm:TradeName', pick(pst, 'TradeName'));

      // PST Density (+ uncertainty)
      const pd = pick(pst, 'Density');
      if (pd) {
        const desc = pick(pd, 'description');
        const v = pick(pd, 'value');
        const u = pick(pd, 'unit');
        const vLit = litNum(v) || litStr(v);
        if (
          vLit ||
          hasText(desc) ||
          hasText(pick(pd, 'uncertainty.type')) ||
          hasText(pick(pd, 'uncertainty.value'))
        ) {
          const node = {
            '@id': `${pstBase}/Density`,
            '@type': 'mm:Density',
            ...(hasText(desc) && { 'rdfs:label': desc }),
            ...(vLit && { 'sio:hasValue': vLit })
          };
          const unitIri = mapUnit(u);
          if (unitIri) node['sio:hasUnit'] = unitIri;
          else if (hasText(u)) node['sio:hasUnit'] = String(u);

          const ut = pick(pd, 'uncertainty.type');
          const uv = pick(pd, 'uncertainty.value');
          if (hasText(ut) || hasText(uv)) {
            node['mm:hasUncertainty'] = {
              '@type': 'mm:Type',
              ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
              ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
            };
          }
          pstAttrs.push(node);
        }
      }

      // GraftDensity (+ uncertainty)
      const gd = pick(pst, 'GraftDensity');
      if (gd) {
        const desc = pick(gd, 'description');
        const v = pick(gd, 'value');
        const u = pick(gd, 'unit');
        const vLit = litNum(v) || litStr(v);
        if (
          vLit ||
          hasText(desc) ||
          hasText(pick(gd, 'uncertainty.type')) ||
          hasText(pick(gd, 'uncertainty.value'))
        ) {
          const node = {
            '@id': `${pstBase}/GraftDensity`,
            '@type': 'mm:GraftDensity',
            ...(hasText(desc) && { 'rdfs:label': desc }),
            ...(vLit && { 'sio:hasValue': vLit })
          };
          const unitIri = mapUnit(u);
          if (unitIri) node['sio:hasUnit'] = unitIri;
          else if (hasText(u)) node['sio:hasUnit'] = String(u);

          const ut = pick(gd, 'uncertainty.type');
          const uv = pick(gd, 'uncertainty.value');
          if (hasText(ut) || hasText(uv)) {
            node['mm:hasUncertainty'] = {
              '@type': 'mm:Type',
              ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
              ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
            };
          }
          pstAttrs.push(node);
        }
      }

      // PST MolecularWeight (+ uncertainty)
      const pmw = pick(pst, 'MolecularWeight');
      if (pmw) {
        const desc = pick(pmw, 'description');
        const v = pick(pmw, 'value');
        const u = pick(pmw, 'unit');
        const vLit = litNum(v) || litStr(v);
        if (
          vLit ||
          hasText(desc) ||
          hasText(pick(pmw, 'uncertainty.type')) ||
          hasText(pick(pmw, 'uncertainty.value'))
        ) {
          const node = {
            '@id': `${pstBase}/MolecularWeight`,
            '@type': 'mm:MolecularWeight',
            ...(hasText(desc) && { 'rdfs:label': desc }),
            ...(vLit && { 'sio:hasValue': vLit })
          };
          const unitIri = mapUnit(u);
          if (unitIri) node['sio:hasUnit'] = unitIri;
          else if (hasText(u)) node['sio:hasUnit'] = String(u);

          const ut = pick(pmw, 'uncertainty.type');
          const uv = pick(pmw, 'uncertainty.value');
          if (hasText(ut) || hasText(uv)) {
            node['mm:hasUncertainty'] = {
              '@type': 'mm:Type',
              ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
              ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
            };
          }
          pstAttrs.push(node);
        }
      }

      // PST_Composition
      const pstc = pick(pst, 'PST_Composition');
      if (pstc) {
        const compAttrs = [];

        const cst = pick(pstc, 'Constituent');
        if (hasText(cst)) {
          compAttrs.push({
            '@id': `${pstBase}/PST_Composition/Constituent`,
            '@type': 'mm:ConstitutionalUnit',
            'sio:hasValue': litStr(cst)
          });
        }

        const frMass = pick(pstc, 'Fraction.Mass') ?? pick(pstc, 'Mass');
        const frVol = pick(pstc, 'Fraction.Volume') ?? pick(pstc, 'Volume');
        const frAttrs = [];
        const mLit = litNum(frMass);
        if (mLit) {
          frAttrs.push({
            '@id': `${pstBase}/PST_Composition/Fraction/Mass`,
            '@type': 'mm:MassFraction',
            'sio:hasValue': mLit
          });
        }
        const vLit2 = litNum(frVol);
        if (vLit2) {
          frAttrs.push({
            '@id': `${pstBase}/PST_Composition/Fraction/Volume`,
            '@type': 'mm:VolumeFraction',
            'sio:hasValue': vLit2
          });
        }
        if (frAttrs.length) {
          compAttrs.push({
            '@id': `${pstBase}/PST_Composition/Fraction`,
            '@type': 'mm:ConstitutionalUnit',
            'sio:hasAttribute': frAttrs
          });
        }

        if (compAttrs.length) {
          pstAttrs.push({
            '@id': `${pstBase}/PST_Composition`,
            '@type': 'mm:ParticleSurfaceTreatmentComposition',
            'sio:hasAttribute': compAttrs
          });
        }
      }

      // SurfaceChemistryProcessing → reuse MatrixProcessing parameter logic, but base it on pstBase to carry index
      const scp = pick(pst, 'SurfaceChemistryProcessing');
      if (scp) {
        const params = toArray(pick(scp, 'ChooseParameter'));
        const paramNodes = params
          .map((cp, j) => {
            const idx = j + 1;
            const paramId = `${pstBase}/SurfaceChemistryProcessing/parameter${idx}`;

            const curing = pick(cp, 'Curing');
            if (curing) {
              return buildCuringLike('mm:Curing', 'curing', curing, paramId);
            }

            const add = pick(cp, 'Additive');
            if (add) return buildAdditiveParam(add, paramId);

            const sol = pick(cp, 'Solvent');
            if (sol) return buildSolventParam(sol, paramId);

            const heating = pick(cp, 'Heating');
            if (heating) {
              return buildCuringLike('mm:Heating', 'heating', heating, paramId);
            }

            const cooling = pick(cp, 'Cooling');
            if (cooling) {
              return buildCuringLike('mm:Cooling', 'cooling', cooling, paramId);
            }

            const drying =
              pick(cp, 'Drying-Evaporation') ||
              (cp && cp['Drying-Evaporation']);
            if (drying) {
              return buildCuringLike(
                'mm:Drying-Evaporation',
                'Drying-Evaporation',
                drying,
                paramId
              );
            }

            const extrusion = pick(cp, 'Extrusion');
            if (extrusion) {
              return buildExtrusionParam(
                extrusion,
                paramId,
                pstBase,
                'SurfaceChemistryProcessing'
              );
            }

            const centrif = pick(cp, 'Centrifugation');
            if (hasText(centrif)) {
              return {
                '@id': paramId,
                '@type': 'mm:Centrifugation',
                'sio:hasValue': litStr(centrif)
              };
            }

            const molding = pick(cp, 'Molding');
            if (molding) {
              const subAttrs = [];
              const mode = pick(molding, 'MoldingMode');
              if (hasText(mode)) {
                const m = mode.toString().toLowerCase();
                let typeIri = 'mm:MoldingMode';
                if (m.includes('hot')) typeIri = 'mm:HotPressing';
                else if (m.includes('cast')) typeIri = 'mm:Casting';
                else if (m.includes('inject')) typeIri = 'mm:InjectionMolding';
                else if (m.includes('rotat')) typeIri = 'mm:RotationalMolding';
                else if (m.includes('vacuum')) typeIri = 'mm:VacuumMolding';

                subAttrs.push({
                  '@id': `${pstBase}/SurfaceChemistryProcessing/Molding/MoldingMode`,
                  '@type': typeIri,
                  'sio:hasValue': litStr(mode)
                });
              }
              const info = pick(molding, 'MoldingInfo');
              if (info) {
                const infoNode = buildCuringLike(
                  'mm:Molding',
                  'Molding/MoldingInfo',
                  info,
                  `${paramId}/MoldingInfo`
                );
                if (infoNode) subAttrs.push(infoNode);
              }
              return subAttrs.length
                ? {
                    '@id': paramId,
                    '@type': 'mm:Molding',
                    'sio:hasAttribute': subAttrs
                  }
                : null;
            }

            const mixing = pick(cp, 'Mixing');
            if (mixing) {
              return buildMixingParam(
                mixing,
                paramId,
                pstBase,
                'SurfaceChemistryProcessing'
              );
            }

            const other = pick(cp, 'Other');
            if (hasText(other)) {
              return {
                '@id': paramId,
                '@type': 'mm:Other',
                'sio:hasValue': litStr(other)
              };
            }

            return null;
          })
          .filter(Boolean);

        if (paramNodes.length) {
          pstAttrs.push({
            '@id': `${pstBase}/SurfaceChemistryProcessing`,
            '@type': 'mm:SurfaceChemistryProcessing',
            'sio:hasAttribute': paramNodes
          });
        }
      }

      if (pstAttrs.length) {
        attrs.push({
          '@id': pstBase,
          '@type': 'mm:ParticleSurfaceTreatment',
          'sio:hasAttribute': pstAttrs
        });
      }
    });
  }

  return {
    '@id': fcId,
    '@type': 'mm:FillerComponent',
    ...(attrs.length ? { 'sio:hasAttribute': attrs } : {})
  };
}

function buildThermalProperty(propertiesObj, baseId) {
  const thermal = pick(propertiesObj, 'Thermal');
  if (!thermal) return [];

  const out = [];

  // --- helpers ---
  const buildScalarSet = (key, typeIri) => {
    const arr = toArray(pick(thermal, key));
    if (!arr.length) return;

    arr.forEach((nodeObj, i) => {
      const idBase = `${baseId}/attr/properties/Thermal/${key}`;
      const nodeId = arr.length === 1 ? idBase : `${idBase}/${i + 1}`;

      // value/unit (support nested or direct)
      const val =
        pick(nodeObj, 'value.value') ??
        pick(nodeObj, 'Value.value') ??
        pick(nodeObj, 'value') ??
        pick(nodeObj, 'Value');
      const unit =
        pick(nodeObj, 'value.unit') ??
        pick(nodeObj, 'Value.unit') ??
        pick(nodeObj, 'unit') ??
        pick(nodeObj, 'Unit');
      const vLit = litNum(val) || litStr(val);

      // optional dataset under .../data or .../data.data
      const table = pick(nodeObj, 'data.data') ?? pick(nodeObj, 'data');
      const d = pick(nodeObj, 'data.description');
      const dsId = `${nodeId}/data`;
      const dataset = table
        ? CH.buildSioDatasetFromTable(table, dsId, d)
        : null;

      // skip if neither value nor dataset
      if (!vLit && !dataset) return;

      const n = {
        '@id': nodeId,
        '@type': ['mm:ThermalProperty', typeIri],
        ...(vLit ? { 'sio:hasValue': vLit } : {})
      };

      if (unit != null) {
        const unitIri = mapUnit(unit);
        if (unitIri) n['sio:hasUnit'] = unitIri;
        else if (hasText(unit)) n['sio:hasUnit'] = String(unit);
      }

      // optional uncertainty (same pattern as GTT)
      const uv = pick(nodeObj, 'uncertainty.value');
      const ut = pick(nodeObj, 'uncertainty.type');
      if (hasText(ut) || hasText(uv)) {
        n['mm:hasUncertainty'] = {
          '@type': 'mm:Type',
          ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
          ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
        };
      }

      if (dataset) n['sio:isDescribedBy'] = dataset;

      out.push(n);
    });
  };

  const buildCrystallinity = () => {
    const crystals = toArray(pick(thermal, 'Crystallinity'));
    if (!crystals.length) return;

    const SUBS = [
      ['DegreeOfCrystallization', 'mm:DegreeOfCrystallization'],
      ['GrowthRateOfCrystal', 'mm:GrowthRateOfCrystal'],
      [
        'GrowthRateParameterOfAvramiEquation',
        'mm:GrowthRateParameterOfAvramiEquation'
      ],
      [
        'NucleationParameterOfAvramiEquation',
        'mm:NucleationParameterOfAvramiEquation'
      ],
      ['HalflifeOfCrystallization', 'mm:HalflifeOfCrystallization']
    ];

    crystals.forEach((cObj, ci) => {
      const cIdBase = `${baseId}/attr/properties/Thermal/Crystallinity`;
      const cId = crystals.length === 1 ? cIdBase : `${cIdBase}/${ci + 1}`;
      const subNodes = [];

      SUBS.forEach(([k, tIri]) => {
        const arr = toArray(pick(cObj, k));
        if (!arr.length) return;

        arr.forEach((x, xi) => {
          const subBase = `${baseId}/attr/properties/Thermal/${k}`;
          const subId = arr.length === 1 ? subBase : `${subBase}/${xi + 1}`;

          const val =
            pick(x, 'value.value') ??
            pick(x, 'Value.value') ??
            pick(x, 'value') ??
            pick(x, 'Value');
          const unit =
            pick(x, 'value.unit') ??
            pick(x, 'Value.unit') ??
            pick(x, 'unit') ??
            pick(x, 'Unit');
          const vLit = litNum(val) || litStr(val);

          const table = pick(x, 'data.data') ?? pick(x, 'data');
          const d = pick(x, 'data.description');
          const dsId = `${subId}/data`;
          const dataset = table
            ? CH.buildSioDatasetFromTable(table, dsId, d)
            : null;

          if (!vLit && !dataset) return;

          const sub = {
            '@id': subId,
            '@type': ['mm:Crystallinity', tIri],
            ...(vLit ? { 'sio:hasValue': vLit } : {})
          };

          if (unit != null) {
            const unitIri = mapUnit(unit);
            if (unitIri) sub['sio:hasUnit'] = unitIri;
            else if (hasText(unit)) sub['sio:hasUnit'] = String(unit);
          }

          const uv = pick(x, 'uncertainty.value');
          const ut = pick(x, 'uncertainty.type');
          if (hasText(ut) || hasText(uv)) {
            sub['mm:hasUncertainty'] = {
              '@type': 'mm:Type',
              ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
              ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
            };
          }

          if (dataset) sub['sio:isDescribedBy'] = dataset;

          subNodes.push(sub);
        });
      });

      if (subNodes.length) {
        out.push({
          '@id': cId,
          '@type': ['mm:ThermalProperty', 'mm:Crystallinity'],
          'sio:hasAttribute': subNodes
        });
      }
    });
  };

  // --- order of emission (to mirror your sample) ---

  // 1) GlassTransitionTemperature (1..n)
  buildScalarSet('GlassTransitionTemperature', 'mm:GlassTransitionTemperature');

  // 2) MeasurementMethod (text)
  const mmVal = pick(thermal, 'MeasurementMethod');
  if (hasText(mmVal)) {
    out.push({
      '@id': `${baseId}/attr/properties/Thermal/MeasurementMethod`,
      '@type': ['mm:ThermalProperty', 'mm:MeasurementMethod'],
      'sio:hasValue': litStr(mmVal)
    });
  }

  // 3) Remaining scalar thermal leaves (each can be 1..n; same logic as GTT)
  const SCALARS = [
    ['HeatOfCrystallization', 'mm:HeatOfCrystallization'],
    ['CrystalizationTemperature', 'mm:CrystallizationTemperature'],
    // Crystallinity handled separately just below
    ['HeatOfFusion', 'mm:HeatOfFusion'],
    ['DSC_Profile', 'mm:DSCProfile'],
    ['ThermalDecompositionTemperature', 'mm:ThermalDecompositionTemperature'],
    ['LC_PhaseTransitionTemperature', 'mm:LCPhaseTransitionTemperature'],
    ['MeltingTemperature', 'mm:MeltingTemperature'],
    ['SpecificHeatCapacity_Cp', 'mm:SpecificHeatCapacityCp'],
    ['SpecificHeatCapacity_Cv', 'mm:SpecificHeatCapacityCv'],
    ['ThermalConductivity', 'mm:ThermalConductivity'],
    ['ThermalDiffusivity', 'mm:ThermalDiffusivity'],
    ['BrittleTemperature', 'mm:BrittleTemperature']
  ];
  SCALARS.forEach(([k, t]) => buildScalarSet(k, t));

  // 4) Crystallinity (parent; each may contain multiple sub-leaves)
  buildCrystallinity();

  return out;
}

function buildMechanicalProperty(propertiesObj, baseId) {
  const mech = pick(propertiesObj, 'Mechanical');
  if (!mech) return [];

  const out = [];

  // ---------- small helpers ----------

  // Build a scalar set under a parent object (value/unit/uncertainty + optional dataset), with indexing.
  // - parentObj: object containing the scalar leaf/leaves
  // - key: path of the leaf inside parentObj
  // - typePair: [parentTypeIri, specificTypeIri] e.g. ['mm:TensileProperty','mm:TensileModulus']
  // - idBase: base id for the scalar node
  function buildScalarSetUnder(parentObj, key, typePair, idBase) {
    const arr = toArray(pick(parentObj, key));
    if (!arr.length) return [];

    return arr
      .map((nodeObj, i) => {
        const nodeId = arr.length === 1 ? idBase : `${idBase}/${i + 1}`;

        const val =
          pick(nodeObj, 'value.value') ??
          pick(nodeObj, 'Value.value') ??
          pick(nodeObj, 'value') ??
          pick(nodeObj, 'Value');
        const unit =
          pick(nodeObj, 'value.unit') ??
          pick(nodeObj, 'Value.unit') ??
          pick(nodeObj, 'unit') ??
          pick(nodeObj, 'Unit');

        const vLit = litNum(val) || litStr(val);

        const table = pick(nodeObj, 'data.data') ?? pick(nodeObj, 'data');
        const d = pick(nodeObj, 'data.description');
        const dsId = `${nodeId}/data`;
        const dataset = table
          ? CH.buildSioDatasetFromTable(table, dsId, d)
          : null;

        if (!vLit && !dataset) return null;

        const n = {
          '@id': nodeId,
          '@type': typePair,
          ...(vLit ? { 'sio:hasValue': vLit } : {})
        };

        if (unit != null) {
          const unitIri = mapUnit(unit);
          if (unitIri) n['sio:hasUnit'] = unitIri;
          else if (hasText(unit)) n['sio:hasUnit'] = String(unit);
        }

        const uv = pick(nodeObj, 'uncertainty.value');
        const ut = pick(nodeObj, 'uncertainty.type');
        if (hasText(ut) || hasText(uv)) {
          n['mm:hasUncertainty'] = {
            '@type': 'mm:Type',
            ...(hasText(ut) && { 'sio:hasValue': litStr(ut) }),
            ...(hasText(uv) && { 'mm:hasTypeValue': String(uv) })
          };
        }

        if (dataset) n['sio:isDescribedBy'] = dataset;
        return n;
      })
      .filter(Boolean);
  }

  // Build a LoadingProfile/profile with AxisLabels and optional dataset table. Supports multiple.
  // - parentObj: object holding LoadingProfile(s) or profile(s)
  // - key: 'LoadingProfile' or 'profile'
  // - idBase: base id for profile node
  // - typePair: ['mm:<ParentPropertyType>', 'mm:<ProfileType>']
  // - axisType: either 'mm:AxisLabel' or ['mm:<ProfileType>','mm:AxisLabel'] depending on your spec
  function buildProfileSet(parentObj, key, idBase, typePair, axisType) {
    const profiles = toArray(pick(parentObj, key));
    if (!profiles.length) return [];

    return profiles.map((lp, i) => {
      const lpId = profiles.length === 1 ? idBase : `${idBase}/${i + 1}`;
      const node = {
        '@id': lpId,
        '@type': typePair
      };

      const desc = pick(lp, 'description');
      if (hasText(desc)) node['sio:comment'] = String(desc);

      // Axis labels
      const xName = pick(lp, 'AxisLabel.xName');
      const xUnit = pick(lp, 'AxisLabel.xUnit');
      const yName = pick(lp, 'AxisLabel.yName');
      const yUnit = pick(lp, 'AxisLabel.yUnit');
      const axisArr = [];

      const makeAxis = (axis, label, unitVal) => {
        const a = {
          '@type': axisType || 'mm:AxisLabel',
          'rdfs:label': label,
          'mm:axis': axis
        };
        if (hasText(label === 'X-Axis Label' ? xName : yName)) {
          a['sio:hasValue'] = litStr(label === 'X-Axis Label' ? xName : yName);
        }
        const ui = mapUnit(unitVal);
        if (ui) a['sio:hasUnit'] = ui;
        else if (hasText(unitVal)) a['sio:hasUnit'] = String(unitVal);
        return a;
      };

      if (hasText(xName) || hasText(xUnit))
        axisArr.push(makeAxis('x', 'X-Axis Label', xUnit));
      if (hasText(yName) || hasText(yUnit))
        axisArr.push(makeAxis('y', 'Y-Axis Label', yUnit));
      if (axisArr.length) node['mm:hasAxisLabel'] = axisArr;

      // Optional dataset
      const table = pick(lp, 'data.data') ?? pick(lp, 'data');
      const d = pick(lp, 'data.description');
      const dsId = `${lpId}/data`;
      const ds = table ? CH.buildSioDatasetFromTable(table, dsId, d) : null;
      if (ds) node['sio:isDescribedBy'] = ds;

      return node;
    });
  }

  // Build Conditions (StrainRate, PreLoad) as scalar sets under ".../Conditions"
  function buildConditions(parentObj, idBase, parentType) {
    const arr = toArray(pick(parentObj, 'Conditions'));
    if (!arr.length) return [];

    const outSub = [];
    arr.forEach((cObj, ci) => {
      const condBaseId = `${idBase}/Conditions`;
      const condId = arr.length === 1 ? condBaseId : `${condBaseId}/${ci + 1}`;

      const condAttrs = [
        ...buildScalarSetUnder(
          cObj,
          'StrainRate',
          ['mm:Condition', 'mm:StrainRate'],
          `${condId}/StrainRate`
        ),
        ...buildScalarSetUnder(
          cObj,
          'PreLoad',
          ['mm:Condition', 'mm:PreLoad'],
          `${condId}/PreLoad`
        )
      ];

      if (condAttrs.length) {
        outSub.push({
          '@id': condId,
          '@type': [parentType, 'mm:Condition'],
          'sio:hasAttribute': condAttrs
        });
      }
    });

    return outSub;
  }

  // Generic mechanical group builder (Tensile/Flexural/Compression/Shear/Impact/Hardness)
  function buildMechanicalGroup(groupKey, groupTypeIri, groupSpec) {
    const arr = toArray(pick(mech, groupKey));
    if (!arr.length) return [];

    return arr
      .map((obj, gi) => {
        const rootBase = `${baseId}/attr/properties/Mechanical/${groupKey}`;
        const rootId = arr.length === 1 ? rootBase : `${rootBase}/${gi + 1}`;

        const sub = [];

        // LoadingProfile
        if (groupSpec.loadingProfile) {
          const [profileTypeIri, axisLabelType] = groupSpec.loadingProfile; // e.g., ['mm:TensileLoadingProfile', 'mm:AxisLabel'] or ['mm:FlexuralLoadingProfile', ['mm:FlexuralLoadingProfile','mm:AxisLabel']]
          sub.push(
            ...buildProfileSet(
              obj,
              'LoadingProfile',
              `${rootId}/LoadingProfile`,
              [groupTypeIri, profileTypeIri],
              axisLabelType
            )
          );
        }

        // Scalars inside this group
        if (groupSpec.scalars) {
          groupSpec.scalars.forEach(([k, tIri]) => {
            sub.push(
              ...buildScalarSetUnder(
                obj,
                k,
                [groupTypeIri, tIri],
                `${rootId}/${k}`
              )
            );
          });
        }

        // Special text-only leaves (simple value only)
        if (groupSpec.textOnly) {
          groupSpec.textOnly.forEach(([k, tIri]) => {
            const vals = toArray(pick(obj, k));
            vals.forEach((v, i) => {
              const text = hasText(v?.value) ? v.value : v;
              if (!hasText(text)) return;
              const idB = `${rootId}/${k}`;
              const nid = vals.length === 1 ? idB : `${idB}/${i + 1}`;
              sub.push({
                '@id': nid,
                '@type': [groupTypeIri, tIri],
                'sio:hasValue': litStr(text)
              });
            });
          });
        }

        // Conditions
        if (groupSpec.conditions) {
          sub.push(...buildConditions(obj, rootId, groupTypeIri));
        }

        if (!sub.length) return null;

        return {
          '@id': rootId,
          '@type': ['mm:MechanicalProperty', `${groupTypeIri}`],
          'sio:hasAttribute': sub
        };
      })
      .filter(Boolean);
  }

  // ---------- FractureToughness (special nested structure) ----------

  function buildFractureToughness() {
    const arr = toArray(pick(mech, 'FractureToughness'));
    if (!arr.length) return [];

    return arr
      .map((ftObj, fi) => {
        const rootBase = `${baseId}/attr/properties/Mechanical/FractureToughness`;
        const rootId = arr.length === 1 ? rootBase : `${rootBase}/${fi + 1}`;
        const sub = [];

        // --- EssentialWorkOfFracture ---
        const ewfArr = toArray(pick(ftObj, 'EssentialWorkOfFracture'));
        ewfArr.forEach((ewf, ei) => {
          const baseE = `${rootId}/EssentialWorkOfFracture`;
          const eId = ewfArr.length === 1 ? baseE : `${baseE}/${ei + 1}`;
          const eSub = [];

          // text leaves
          const preCrack = pick(ewf, 'preCrackingProcess');
          if (hasText(preCrack)) {
            eSub.push({
              '@id': `${eId}/PreCrackingProcess`,
              '@type': ['mm:EssentialWorkOfFracture', 'mm:PreCrackingProcess'],
              'sio:hasValue': litStr(preCrack)
            });
          }

          // numeric/scalar leaves
          eSub.push(
            ...buildScalarSetUnder(
              ewf,
              'strainRate',
              ['mm:EssentialWorkOfFracture', 'mm:StrainRate'],
              `${eId}/strainRate`
            )
          );
          eSub.push(
            ...buildScalarSetUnder(
              ewf,
              'FractureEnergy',
              ['mm:EssentialWorkOfFracture', 'mm:FractureEnergy'],
              `${eId}/FractureEnergy`
            )
          );

          // profile (dataset + axis labels)
          eSub.push(
            ...buildProfileSet(
              ewf,
              'profile',
              `${eId}/profile`,
              ['mm:EssentialWorkOfFracture', 'mm:Profile'],
              ['mm:CompressiveLoadingProfile', 'mm:AxisLabel'] // per your sample
            )
          );

          if (eSub.length) {
            sub.push({
              '@id': eId,
              '@type': [
                'mm:FractureToughnessProperty',
                'mm:EssentialWorkOfFracture'
              ],
              'sio:hasAttribute': eSub
            });
          }
        });

        // --- LinearElastic ---
        const leArr = toArray(pick(ftObj, 'LinearElastic'));
        leArr.forEach((le, li) => {
          const baseL = `${rootId}/LinearElastic`;
          const lId = leArr.length === 1 ? baseL : `${baseL}/${li + 1}`;
          const lSub = [];

          // text leaves
          const sampleShape = pick(le, 'sampleShape');
          if (hasText(sampleShape)) {
            lSub.push({
              '@id': `${lId}/sampleShape`,
              '@type': ['mm:LinearElastic', 'mm:SampleShape'],
              'sio:hasValue': litStr(sampleShape)
            });
          }
          const preCrack = pick(le, 'preCrackingProcess');
          if (hasText(preCrack)) {
            lSub.push({
              '@id': `${lId}/preCrackingProcess`,
              '@type': ['mm:LinearElastic', 'mm:PreCrackingProcess'],
              'sio:hasValue': litStr(preCrack)
            });
          }
          const kFactor = pick(le, 'K-factor');
          if (hasText(kFactor)) {
            lSub.push({
              '@id': `${lId}/K-factor`,
              '@type': ['mm:LinearElastic', 'mm:KFactor'],
              'sio:hasValue': litStr(kFactor)
            });
          }

          // numeric/scalar leaves
          lSub.push(
            ...buildScalarSetUnder(
              le,
              'strainRate',
              ['mm:LinearElastic', 'mm:StrainRate'],
              `${lId}/strainRate`
            )
          );
          lSub.push(
            ...buildScalarSetUnder(
              le,
              'FractureEnergy',
              ['mm:LinearElastic', 'mm:FractureEnergy'],
              `${lId}/FractureEnergy`
            )
          );

          // profile
          lSub.push(
            ...buildProfileSet(
              le,
              'profile',
              `${lId}/profile`,
              ['mm:LinearElastic', 'mm:Profile'],
              ['mm:CompressiveLoadingProfile', 'mm:AxisLabel'] // per your sample
            )
          );

          if (lSub.length) {
            sub.push({
              '@id': lId,
              '@type': ['mm:FractureToughnessProperty', 'mm:LinearElastic'],
              'sio:hasAttribute': lSub
            });
          }
        });

        // --- PlasticElastic ---
        const peArr = toArray(pick(ftObj, 'PlasticElastic'));
        peArr.forEach((pe, pi) => {
          const baseP = `${rootId}/PlasticElastic`;
          const pId = peArr.length === 1 ? baseP : `${baseP}/${pi + 1}`;
          const pSub = [];

          // text leaves
          const sampleShape = pick(pe, 'sampleShape');
          if (hasText(sampleShape)) {
            pSub.push({
              '@id': `${pId}/sampleShape`,
              '@type': ['mm:PlasticElastic', 'mm:SampleShape'],
              'sio:hasValue': litStr(sampleShape)
            });
          }
          const preCrack = pick(pe, 'preCrackingProcess');
          if (hasText(preCrack)) {
            pSub.push({
              '@id': `${pId}/preCrackingProcess`,
              '@type': ['mm:PlasticElastic', 'mm:PreCrackingProcess'],
              'sio:hasValue': litStr(preCrack)
            });
          }
          const jIntegral = pick(pe, 'J-integral');
          if (hasText(jIntegral)) {
            pSub.push({
              '@id': `${pId}/J-integral`,
              '@type': ['mm:PlasticElastic', 'mm:JIntegral'],
              'sio:hasValue': litStr(jIntegral)
            });
          }

          // numeric/scalar leaves
          pSub.push(
            ...buildScalarSetUnder(
              pe,
              'strainRate',
              ['mm:PlasticElastic', 'mm:StrainRate'],
              `${pId}/strainRate`
            )
          );
          pSub.push(
            ...buildScalarSetUnder(
              pe,
              'FractureEnergy',
              ['mm:PlasticElastic', 'mm:FractureEnergy'],
              `${pId}/FractureEnergy`
            )
          );

          // profile
          pSub.push(
            ...buildProfileSet(
              pe,
              'profile',
              `${pId}/profile`,
              ['mm:PlasticElastic', 'mm:Profile'],
              ['mm:CompressiveLoadingProfile', 'mm:AxisLabel'] // per your sample
            )
          );

          if (pSub.length) {
            sub.push({
              '@id': pId,
              '@type': ['mm:FractureToughnessProperty', 'mm:PlasticElastic'],
              'sio:hasAttribute': pSub
            });
          }
        });

        if (!sub.length) return null;
        return {
          '@id': rootId,
          '@type': ['mm:MechanicalProperty', 'mm:FractureToughnessProperty'],
          'sio:hasAttribute': sub
        };
      })
      .filter(Boolean);
  }

  // ---------- Build each mechanical group ----------

  // Tensile
  out.push(
    ...buildMechanicalGroup('Tensile', 'mm:TensileProperty', {
      loadingProfile: ['mm:TensileLoadingProfile', 'mm:AxisLabel'],
      scalars: [
        ['TensileModulus', 'mm:TensileModulus'],
        ['TensileStressAtBreak', 'mm:TensileStressAtBreak'],
        ['TensileStressAtYield', 'mm:TensileStressAtYield'],
        ['TensileStrength', 'mm:TensileStrength'],
        ['StressRelaxation', 'mm:StressRelaxation'],
        ['StrainAtBreak', 'mm:StrainAtBreak'],
        ['ElongationAtYield', 'mm:ElongationAtYield'],
        ['ElongationAtBreak', 'mm:ElongationAtBreak'],
        ['TensileToughness', 'mm:TensileToughness'],
        ['FiberTensileModulus', 'mm:FiberTensileModulus'],
        ['FiberTensileStrength', 'mm:FiberTensileStrength'],
        ['FiberTensileElongation', 'mm:FiberTensileElongation'],
        ['PoissonsRatio', 'mm:PoissonsRatio'] // value-only is fine; unit/uncertainty supported if present
      ],
      conditions: true
    })
  );

  // Flexural
  out.push(
    ...buildMechanicalGroup('Flexural', 'mm:FlexuralProperty', {
      loadingProfile: [
        'mm:FlexuralLoadingProfile',
        ['mm:FlexuralLoadingProfile', 'mm:AxisLabel']
      ],
      scalars: [
        ['FlexuralModulus', 'mm:FlexuralModulus'],
        ['FlexuralStressAtBreak', 'mm:FlexuralStressAtBreak'],
        ['FlexuralStressAtYield', 'mm:FlexuralStressAtYield'],
        ['FlexuralToughness', 'mm:FlexuralToughness']
      ],
      conditions: true
    })
  );

  // Compression
  out.push(
    ...buildMechanicalGroup('Compression', 'mm:CompressionProperty', {
      loadingProfile: [
        'mm:CompressiveLoadingProfile',
        ['mm:CompressiveLoadingProfile', 'mm:AxisLabel']
      ],
      scalars: [
        ['CompressionModulus', 'mm:CompressionModulus'],
        ['CompressionStressAtBreak', 'mm:CompressionStressAtBreak'],
        ['CompressionStressAtYield', 'mm:CompressionStressAtYield'],
        ['CompressionToughness', 'mm:CompressiveToughness']
      ],
      conditions: true
    })
  );

  // Shear
  out.push(
    ...buildMechanicalGroup('Shear', 'mm:ShearProperty', {
      loadingProfile: [
        'mm:ShearLoadingProfile',
        ['mm:ShearLoadingProfile', 'mm:AxisLabel']
      ],
      scalars: [
        ['ShearModulus', 'mm:ShearModulus'],
        ['ShearStressAtBreak', 'mm:ShearStressAtBreak'],
        ['ShearStressAtYield', 'mm:ShearStressAtYield']
      ],
      conditions: true
    })
  );

  // FractureToughness (special)
  out.push(...buildFractureToughness());

  // Impact
  (function () {
    const arr = toArray(pick(mech, 'Impact'));
    if (!arr.length) return;

    arr.forEach((imp, ii) => {
      const base = `${baseId}/attr/properties/Mechanical/Impact`;
      const rootId = arr.length === 1 ? base : `${base}/${ii + 1}`;
      const sub = [];

      // Notch (text)
      const notchVals = toArray(pick(imp, 'Notch'));
      notchVals.forEach((nv, ni) => {
        const text = hasText(nv?.value) ? nv.value : nv;
        if (!hasText(text)) return;
        const idB = `${rootId}/Notch`;
        const nid = notchVals.length === 1 ? idB : `${idB}/${ni + 1}`;
        sub.push({
          '@id': nid,
          '@type': ['mm:Impact', 'mm:Notched'],
          'sio:hasValue': litStr(text)
        });
      });

      // Scalar impact leaves
      [
        ['IZOD_Area', 'mm:IZODArea'],
        ['IZOD_ImpactEnergy', 'mm:IZOD_ImpactEnergy'],
        ['CharpyImpactEnergy', 'mm:CharpyImpactEnergy'],
        ['ImpactToughness', 'mm:ImpactToughness']
      ].forEach(([k, tIri]) => {
        sub.push(
          ...buildScalarSetUnder(imp, k, ['mm:Impact', tIri], `${rootId}/${k}`)
        );
      });

      if (sub.length) {
        out.push({
          '@id': rootId,
          '@type': ['mm:MechanicalProperty', 'mm:Impact'],
          'sio:hasAttribute': sub
        });
      }
    });
  })();

  // Hardness
  (function () {
    const arr = toArray(pick(mech, 'Hardness'));
    if (!arr.length) return;

    arr.forEach((hd, hi) => {
      const base = `${baseId}/attr/properties/Mechanical/Hardness`;
      const rootId = arr.length === 1 ? base : `${base}/${hi + 1}`;
      const sub = [];

      // Text-only leaves
      const ht = toArray(pick(hd, 'HardnessTestStandard'));
      ht.forEach((v, i) => {
        const text = hasText(v?.value) ? v.value : v;
        if (!hasText(text)) return;
        const idB = `${rootId}/HardnessTestStandard`;
        const nid = ht.length === 1 ? idB : `${idB}/${i + 1}`;
        sub.push({
          '@id': nid,
          '@type': ['mm:HardnessProperty', 'mm:HardnessTestStandard'],
          'sio:hasValue': litStr(text)
        });
      });

      const hs = toArray(pick(hd, 'HardnessScale'));
      hs.forEach((v, i) => {
        const text = hasText(v?.value) ? v.value : v;
        if (!hasText(text)) return;
        const idB = `${rootId}/HardnessScale`;
        const nid = hs.length === 1 ? idB : `${idB}/${i + 1}`;
        sub.push({
          '@id': nid,
          '@type': ['mm:HardnessProperty', 'mm:HardnessScale'],
          'sio:hasValue': litStr(text)
        });
      });

      // Scalar HardnessValue (with full logic)
      sub.push(
        ...buildScalarSetUnder(
          hd,
          'HardnessValue',
          ['mm:HardnessProperty', 'mm:HardnessValue'],
          `${rootId}/HardnessValue`
        )
      );

      if (sub.length) {
        out.push({
          '@id': rootId,
          '@type': ['mm:MechanicalProperty', 'mm:HardnessProperty'],
          'sio:hasAttribute': sub
        });
      }
    });
  })();

  return out.filter(Boolean);
}

/* ------------------------ Materials + Microstructure (nested) ------------------------ */
function buildMaterialsAndMicrostructure(pnc, baseId) {
  const materialsId = `${baseId}/attr/materials`;

  // Matrix & components
  const matrixDescription = pick(
    pnc,
    'PolymerNanocomposite.MATERIALS.Matrix.Description'
  );
  const matrixComponents = toArray(
    pick(pnc, 'PolymerNanocomposite.MATERIALS.Matrix.MatrixComponent')
  );

  const componentNodes = matrixComponents.map((mc, idx) => {
    const componentId =
      idx === 0
        ? `${baseId}/MatrixComponents`
        : `${baseId}/MatrixComponents/${idx + 1}`;
    return buildMatrixComponent(mc, componentId);
  });

  const matrixProcessing = buildMatrixProcessing(pnc, baseId);

  const hasMatrix =
    componentNodes.length || matrixProcessing
      ? {
          '@id': `${baseId}/matrix`,
          '@type': 'mm:Matrix',
          ...(hasText(matrixDescription)
            ? { 'rdfs:label': matrixDescription }
            : { 'rdfs:label': 'Polymer matrix' }),
          ...(componentNodes.length
            ? {
                'mm:hasMatrixComponent':
                  componentNodes.length === 1
                    ? componentNodes[0]
                    : componentNodes
              }
            : {}),
          ...(matrixProcessing
            ? { 'mm:hasMatrixProcessing': matrixProcessing }
            : {})
        }
      : null;

  // Filler skeleton
  const fillerRoot = pick(pnc, 'PolymerNanocomposite.MATERIALS.Filler');
  const hasFillerInXml =
    !!fillerRoot ||
    !!pick(pnc, 'PolymerNanocomposite.MATERIALS.Filler.FillerComponent') ||
    !!pick(pnc, 'PolymerNanocomposite.MATERIALS.Filler.FillerComposition') ||
    !!pick(pnc, 'PolymerNanocomposite.MATERIALS.Filler.FillerProcessing');

  let fillerNode = null;
  if (hasFillerInXml) {
    const fillerProcessing = buildFillerProcessing(pnc, baseId);
    const fillerComposition = buildFillerComposition(pnc, baseId);
    const fillerComponents = toArray(
      pick(pnc, 'PolymerNanocomposite.MATERIALS.Filler.FillerComponent')
    );

    let fillerComponentValue = null;
    if (fillerComponents.length > 1) {
      // index all items starting at 1
      fillerComponentValue = fillerComponents.map((fc, i) => {
        const fcId = `${baseId}/FillerComponent/${i + 1}`;
        return buildFillerComponent(fc, fcId, baseId);
        // (Note: rootBaseId kept for symmetry; IDs are derived from fcId)
      });
    } else if (fillerComponents.length === 1) {
      const fcId = `${baseId}/FillerComponent`;
      fillerComponentValue = buildFillerComponent(
        fillerComponents[0],
        fcId,
        baseId
      );
    }

    fillerNode = {
      '@id': `${baseId}/filler`,
      ...(fillerComponentValue
        ? { 'mm:hasFillerComponent': fillerComponentValue }
        : {}),
      ...(fillerProcessing
        ? { 'mm:hasFillerProcessing': fillerProcessing }
        : {}),
      ...(fillerComposition
        ? { 'mm:hasFillerComposition': fillerComposition }
        : {})
    };
  }

  /** Gate mm:hasMaterials — emit only if matrix and/or filler content exists */
  let hasMaterials = null;
  if (hasMatrix || fillerNode) {
    hasMaterials = {
      '@id': materialsId,
      'rdfs:label': 'Material constituent charateristics',
      ...(hasMatrix ? { 'mm:hasMatrix': hasMatrix } : {}),
      ...(fillerNode ? { 'mm:hasFiller': fillerNode } : {})
    };
  }

  // Microstructure
  const microLengthUnit = pick(
    pnc,
    'PolymerNanocomposite.MICROSTRUCTURE.LengthUnit'
  );
  const imageFile = toArray(
    pick(pnc, 'PolymerNanocomposite.MICROSTRUCTURE.ImageFile')
  );

  let hasMicrostructure = null;
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
            '@id': `${imgId}/file`,
            '@type': 'sio:SIO_000396',
            'sio:hasValue': litStr(fileIdOnly)
          };
          const fileDesc = pick(img, 'Description');
          if (hasText(fileDesc)) fileAttr['rdfs:label'] = String(fileDesc);
          iAttrs.push(fileAttr);
        }

        const microscopyType = pick(img, 'MicroscopyType');
        if (hasText(microscopyType)) {
          iAttrs.push({
            '@id': `${imgId}/microscopytype`,
            '@type': 'mm:MicroscopyType',
            'sio:hasValue': litStr(microscopyType)
          });
        }

        const typeText = pick(img, 'Type');
        if (hasText(typeText)) {
          iAttrs.push({
            '@id': `${imgId}/type`,
            '@type': 'mm:Type',
            'sio:hasValue': litStr(typeText)
          });
        }

        const width = pick(img, 'Dimension.width');
        const height = pick(img, 'Dimension.height');
        const widthLit = litNum(width);
        const heightLit = litNum(height);

        const dimSubAttrs = [];
        if (widthLit) {
          const wAttr = {
            '@id': `${imgId}/dimension/width`,
            '@type': 'sio:SIO_000042',
            'sio:hasValue': widthLit
          };
          const unitIri = mapUnit(microLengthUnit);
          if (unitIri) wAttr['sio:hasUnit'] = unitIri;
          else if (hasText(microLengthUnit)) {
            wAttr['sio:hasUnit'] = String(microLengthUnit);
          }
          dimSubAttrs.push(wAttr);
        }
        if (heightLit) {
          const hAttr = {
            '@id': `${imgId}/dimension/height`,
            '@type': 'sio:SIO_000040',
            'sio:hasValue': heightLit
          };
          const unitIri = mapUnit(microLengthUnit);
          if (unitIri) hAttr['sio:hasUnit'] = unitIri;
          else if (hasText(microLengthUnit)) {
            hAttr['sio:hasUnit'] = String(microLengthUnit);
          }
          dimSubAttrs.push(hAttr);
        }
        if (dimSubAttrs.length) {
          iAttrs.push({
            '@id': `${imgId}/dimension`,
            '@type': 'mm:AspectRatio',
            'sio:hasAttribute': dimSubAttrs
          });
        }

        if (!iAttrs.length) return null;
        return {
          '@id': imgId,
          '@type': 'mm:ImageFile',
          'sio:hasAttribute': iAttrs
        };
      })
      .filter(Boolean);

    if (imageNodes.length) {
      hasMicrostructure = {
        '@id': `${baseId}/attr/microstructure`,
        '@type': 'mm:Microstructure',
        'sio:hasAttribute': imageNodes
      };
    }
  }

  return { hasMaterials, hasMicrostructure };
}

/** Build a single ChooseParameter branch with same logic as MatrixProcessing. */
function buildProcessingParam(cp, paramId, baseId, scopePath) {
  const curing = pick(cp, 'Curing');
  if (curing) return buildCuringLike('mm:Curing', 'curing', curing, paramId);

  const add = pick(cp, 'Additive');
  if (add) return buildAdditiveParam(add, paramId);

  const sol = pick(cp, 'Solvent');
  if (sol) return buildSolventParam(sol, paramId);

  const heating = pick(cp, 'Heating');
  if (heating) {
    return buildCuringLike('mm:Heating', 'heating', heating, paramId);
  }

  const cooling = pick(cp, 'Cooling');
  if (cooling) {
    return buildCuringLike('mm:Cooling', 'cooling', cooling, paramId);
  }

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

  const extrusion = pick(cp, 'Extrusion');
  if (extrusion) {
    return buildExtrusionParam(
      extrusion,
      paramId,
      baseId,
      `processing/${scopePath}`
    );
  }

  const centrif = pick(cp, 'Centrifugation');
  if (hasText(centrif)) {
    return {
      '@id': paramId,
      '@type': 'mm:Centrifugation',
      'sio:hasValue': litStr(centrif)
    };
  }

  const molding = pick(cp, 'Molding');
  if (molding) {
    const subAttrs = [];
    const mode = pick(molding, 'MoldingMode');
    if (hasText(mode)) {
      const m = mode.toString().toLowerCase();
      let typeIri = 'mm:MoldingMode';
      if (m.includes('hot')) typeIri = 'mm:HotPressing';
      else if (m.includes('cast')) typeIri = 'mm:Casting';
      else if (m.includes('inject')) typeIri = 'mm:InjectionMolding';
      else if (m.includes('rotat')) typeIri = 'mm:RotationalMolding';
      else if (m.includes('vacuum')) typeIri = 'mm:VacuumMolding';

      subAttrs.push({
        '@id': `${baseId}/processing/${scopePath}/Molding/MoldingMode`,
        '@type': typeIri,
        'sio:hasValue': litStr(mode)
      });
    }
    const info = pick(molding, 'MoldingInfo');
    if (info) {
      const infoNode = buildCuringLike(
        'mm:Molding',
        'Molding/MoldingInfo',
        info,
        `${paramId}/MoldingInfo`
      );
      if (infoNode) subAttrs.push(infoNode);
    }
    return subAttrs.length
      ? { '@id': paramId, '@type': 'mm:Molding', 'sio:hasAttribute': subAttrs }
      : null;
  }

  const mixing = pick(cp, 'Mixing');
  if (mixing) {
    return buildMixingParam(mixing, paramId, baseId, `processing/${scopePath}`);
  }

  const other = pick(cp, 'Other');
  if (hasText(other)) {
    return {
      '@id': paramId,
      '@type': 'mm:Other',
      'sio:hasValue': litStr(other)
    };
  }

  return null;
}

/** Build a PROCESSING section (SolutionProcessing, MeltMixing, In-SituPolymerization, Other_Processing). */
function buildProcessingSection(sectionObj, baseId, scopePath, typeIri) {
  if (!sectionObj) return null;
  const params = toArray(pick(sectionObj, 'ChooseParameter'));
  if (!params.length) return null;

  const paramNodes = params
    .map((cp, i) => {
      const idx = i + 1;
      const paramId = `${baseId}/processing/${scopePath}/parameter${idx}`;
      return buildProcessingParam(cp, paramId, baseId, scopePath);
    })
    .filter(Boolean);

  if (!paramNodes.length) return null;

  return {
    '@id': `${baseId}/processing/${scopePath}`,
    '@type': typeIri,
    'sio:hasAttribute': paramNodes
  };
}

/** Root builder for PolymerNanocomposite.PROCESSING */
function buildProcessing(pnc, baseId) {
  const proc = pick(pnc, 'PolymerNanocomposite.PROCESSING');
  if (!proc) return null;

  // ExperimentalProcedure (simple text)
  const expText = pick(proc, 'ExperimentalProcedure');
  const experimentalProcedure = hasText(expText)
    ? {
        '@id': `${baseId}/processing/ExperimentalProcedure`,
        '@type': 'mm:ExperimentalProcedure',
        'sio:hasValue': litStr(expText)
      }
    : null;

  // Sections that mirror MatrixProcessing param logic
  const solution = buildProcessingSection(
    pick(proc, 'SolutionProcessing'),
    baseId,
    'SolutionProcessing',
    'mm:SolutionProcessing'
  );
  const melt = buildProcessingSection(
    pick(proc, 'MeltMixing'),
    baseId,
    'MeltMixing',
    'mm:MeltMixing'
  );
  const insitu = buildProcessingSection(
    pick(proc, 'In-SituPolymerization'),
    baseId,
    'In-SituPolymerization',
    'mm:In-SituPolymerization'
  );
  const otherp = buildProcessingSection(
    pick(proc, 'Other_Processing'),
    baseId,
    'Other_Processing',
    'mm:Other_Processing'
  );

  if (!experimentalProcedure && !solution && !melt && !insitu && !otherp) {
    return null;
  }

  return {
    '@id': `${baseId}/attr/processing`,
    ...(experimentalProcedure
      ? { 'mm:hasExperimentalProcedure': experimentalProcedure }
      : {}),
    ...(solution ? { 'mm:hasSolutionProcessing': solution } : {}),
    ...(melt ? { 'mm:hasMeltMixing': melt } : {}),
    ...(insitu ? { 'mm:hasIn-SituPolymerization': insitu } : {}),
    ...(otherp ? { 'mm:hasOtherProcessing': otherp } : {})
  };
}

/** Root builder for PolymerNanocomposite.PROPERTIES */
function buildProperties(pnc, baseId) {
  const props = pick(pnc, 'PolymerNanocomposite.PROPERTIES');
  if (!props) return null;

  const thermalItems = buildThermalProperty(props, baseId); // returns an array
  const mechanicalItems = buildMechanicalProperty(props, baseId);

  if (
    (!thermalItems || !thermalItems.length) &&
    (!mechanicalItems || !mechanicalItems.length)
  ) {
    return null;
  }

  return {
    '@id': `${baseId}/attr/properties`,
    ...(thermalItems && thermalItems.length
      ? { 'mm:hasThermalProperty': thermalItems }
      : {}),
    ...(mechanicalItems && mechanicalItems.length
      ? { 'mm:hasMechanicalProperty': mechanicalItems }
      : {})
  };
}

/* ------------------------ Transform: XML(JS) → Nanopub JSON-LD ------------------------ */
async function transformXmlToNanopub(xmlObj, logger) {
  const pnc = xmlObj;
  const id =
    pick(pnc, 'PolymerNanocomposite.ID') ||
    pick(pnc, 'PolymerNanocomposite.Id') ||
    pick(pnc, 'PolymerNanocomposite.id') ||
    pick(pnc, 'PolymerNanocomposite.Control_ID') ||
    pick(pnc, 'PolymerNanocomposite.control_id') ||
    pick(pnc, 'PolymerNanocomposite.Control_Id');
  if (!id) throw new Error('Missing required <ID> element in XML.');

  const npId = `${NP_BASE}${encodeURIComponent(String(id))}`;
  const baseId = `${MM_BASE}pnc/${encodeURIComponent(String(id))}`;

  // Meta for prov/pubinfo
  const common =
    pick(pnc, 'PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields') || {};
  const meta = await buildArticle(common, logger);
  const { doiIri, datePublished, keywords, relatedWorks, authors } = meta;

  // Build nested materials + microstructure (only)
  const { hasMaterials, hasMicrostructure } = buildMaterialsAndMicrostructure(
    pnc,
    baseId
  );
  const hasProcessing = buildProcessing(pnc, baseId);
  const hasProperties = buildProperties(pnc, baseId);

  // Assertion: sample with nested materials & microstructure only
  const sample = {
    '@id': baseId,
    '@type': 'mm:MaterialSample',
    'schema:name': String(id),
    ...(hasMaterials ? { 'mm:hasMaterials': hasMaterials } : {}),
    ...(hasProcessing ? { 'mm:hasProcessing': hasProcessing } : {}),
    ...(hasProperties ? { 'mm:hasProperties': hasProperties } : {}),
    ...(hasMicrostructure ? { 'mm:hasMicrostructure': hasMicrostructure } : {})
  };

  const now = new Date().toISOString();
  const assertionId = `${npId}#assertion`;
  const provId = `${npId}#provenance`;
  const pubinfoId = `${npId}#pubinfo`;

  // Provenance graph (all authors)
  const authorTriples = (authors || []).map((a) => ({
    '@id': a.id,
    '@type': 'schema:Person',
    'schema:name': a.name
  }));

  const provAssertion = {
    '@id': assertionId,
    ...(datePublished && {
      'pav:authoredOn': {
        '@value': String(datePublished),
        '@type': 'xsd:gYear'
      }
    }),
    ...(doiIri && { 'prov:wasDerivedFrom': { '@id': doiIri } }),
    ...(authors && authors.length
      ? {
          'prov:wasAttributedTo': authors.map((a) => ({ '@id': a.id })),
          'pav:authoredBy': authors.map((a) => ({ '@id': a.id }))
        }
      : {}),
    ...(relatedWorks && relatedWorks.length
      ? { 'dct:relation': relatedWorks.map((r) => ({ '@id': r })) }
      : {})
  };

  // Publication-info graph
  const curatorName = (authors && authors[0]?.name) || 'nm-etl';
  const pubinfoNp = {
    '@id': npId,
    'pav:createdBy': { '@id': `${MM_BASE}agent/curator` },
    ...(keywords && keywords.length ? { 'dcat:keyword': keywords } : {}),
    'pav:createdOn': now
  };
  const curatorNode = {
    '@id': `${MM_BASE}agent/curator`,
    '@type': 'schema:Person',
    'schema:name': curatorName
  };

  // Final document
  const doc = {
    '@context': OUTPUT_CONTEXT,
    '@graph': [
      {
        '@id': `${npId}#head`,
        '@graph': [
          {
            '@id': npId,
            '@type': 'np:Nanopublication',
            'np:hasAssertion': { '@id': assertionId },
            'np:hasProvenance': { '@id': provId },
            'np:hasPublicationInfo': { '@id': pubinfoId }
          }
        ]
      },
      {
        '@id': assertionId,
        '@type': 'np:Assertion',
        '@graph': [sample]
      },
      {
        '@id': provId,
        '@type': 'np:Provenance',
        '@graph': [provAssertion, ...authorTriples]
      },
      {
        '@id': pubinfoId,
        '@type': 'np:PublicationInfo',
        '@graph': [pubinfoNp, curatorNode]
      }
    ]
  };

  return { nanopubId: id, nanopub: doc, assertionId };
}

/* ------------------------ Serialize ------------------------ */
async function toJsonLd(nanopub) {
  const compact = await jsonld.compact(nanopub, OUTPUT_CONTEXT, {
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
      dcat: 'http://www.w3.org/ns/dcat#',
      pav: 'http://purl.org/pav/',
      unit: 'http://qudt.org/vocab/unit/',
      np: 'http://www.nanopub.org/nschema#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      xsd: 'http://www.w3.org/2001/XMLSchema#'
    }
  });
  const lines = nquads.split('\n').filter(Boolean);
  for (const line of lines) {
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
  const nquads = await jsonld.toRDF(nanopub, { format: 'application/n-quads' });
  const writer = new Writer({
    format: 'application/trig',
    prefixes: {
      mm: MM_BASE,
      schema: 'http://schema.org/',
      sio: 'http://semanticscience.org/resource/',
      prov: 'http://www.w3.org/ns/prov#',
      dct: 'http://purl.org/dc/terms/',
      dcat: 'http://www.w3.org/ns/dcat#',
      pav: 'http://purl.org/pav/',
      unit: 'http://qudt.org/vocab/unit/',
      np: 'http://www.nanopub.org/nschema#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      xsd: 'http://www.w3.org/2001/XMLSchema#'
    }
  });

  const lines = nquads.split('\n').filter(Boolean);
  for (const line of lines) {
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
