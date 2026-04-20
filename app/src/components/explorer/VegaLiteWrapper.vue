<template>
  <div>
    <p v-show="showSchemaWarning && specValidation.valid === false">Vega-Lite specification does not conform to schema</p>
    <p v-show="renderError">Error while rendering Vega-Lite specification</p>
    <p v-show="!validVersionNum">Could not determine vega lite schema version</p>
    <p v-show="!hasDataObject">No data object was provided in Vega-Lite specification</p>

    <div v-show="!renderError&&validVersionNum" v-bind:id="id"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import vegaLite4Schema from 'vega-lite4/build/vega-lite-schema.json';
import vegaLite5Schema from 'vega-lite5/build/vega-lite-schema.json';
import { compile as vegaLite4Compile } from 'vega-lite4';
import { compile as vegaLite5Compile, isNumeric } from 'vega-lite5';
import embed from 'vega-embed';

import debounce from '@/modules/debounce';

import { validate as jsonValidate } from 'jsonschema';

interface VegaLiteVersion {
  schema: any;
  compile: (spec: any) => { spec: any };
  schemaId?: string;
  versionNum?: string;
}

interface VegaLiteVersions {
  [key: string]: VegaLiteVersion;
}

interface SchemaIdMap {
  [key: string]: VegaLiteVersion;
}

interface SpecValidation {
  valid?: boolean;
  [key: string]: any;
}

interface Props {
  spec?: Record<string, any> | null;
  dataname?: string | null;
  data?: Record<string, any> | null;
  showSchemaWarning?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  spec: null,
  dataname: null,
  data: null,
  showSchemaWarning: false
});

const emit = defineEmits<{
  (e: 'new-vega-view', view: any): void;
}>();

const vegaLiteVersions: VegaLiteVersions = {
  4: {
    schema: vegaLite4Schema,
    compile: vegaLite4Compile
  },
  5: {
    schema: vegaLite5Schema,
    compile: vegaLite5Compile
  }
};

const schemaIdMap: SchemaIdMap = {};

for (const [ver, verObj] of Object.entries(vegaLiteVersions)) {
  const schemaId = `https://vega.github.io/schema/vega-lite/v${ver}.json`;
  schemaIdMap[schemaId] = verObj;
  verObj.schemaId = schemaId;
  verObj.versionNum = ver;
}

const id = ref<string>('vega-lite');
const specValidation = ref<SpecValidation>({});
const renderError = ref<boolean>(false);
const validVersionNum = ref<boolean>(true);

const hasDataObject = computed(() => !!props.spec?.data);

const plotSpec = async (versionNum: string): Promise<void> => {
  // Cancel plotting if the component's element no longer exists in dom
  if (!document.body.contains(document.getElementById(id.value)!)) {
    return;
  }
  try {
    const { spec: vegaSpec } = vegaLiteVersions[versionNum].compile(props.spec!);
    const result = await embed(`#${id.value}`, vegaSpec, {});
    if (props.data) {
      const name = props.dataname || ((props.spec || {}).data || {}).name || 'source_0';
      result.view.insert(name, props.data).resize().run();
    }
    emit('new-vega-view', result.view);
    renderError.value = false;
    alignVegaTooltips();
  } catch (ex) {
    console.error('Error while rendering vega-lite specification', ex);
    renderError.value = true;
  }
};

const alignVegaTooltips = (): void => {
  const canvas = document.getElementsByClassName('marks')[0] as HTMLElement;
  const vegaBindings = document.getElementsByClassName('vega-bindings')[0] as HTMLElement;
  if (canvas && vegaBindings) {
    vegaBindings.style.width = canvas.style.width;
  }
};

const validateSpec = (versionNum: string): void => {
  try {
    const validation = jsonValidate(props.spec, vegaLiteVersions[versionNum].schema);
    if (!validation.valid) {
      console.warn('Invalid spec', validation);
    } else {
      console.debug('Valid spec', validation);
    }
    specValidation.value = validation;
  } catch (e) {
    console.error('spec validation error');
    console.error(e);
    specValidation.value = { valid: false };
  }
};

const getVersionNum = (): string | null => {
  const schemaId = props.spec?.$schema;
  let versionNum: string | null = null;

  if (schemaId) {
    // Try to match using provided schema id
    if (schemaId in schemaIdMap) {
      versionNum = schemaIdMap[schemaId].versionNum!;
    } else {
      console.warn(`unknown vega lite schema type: ${schemaId}`);
      console.warn('available schemas:', Object.keys(schemaIdMap));
    }
  } else {
    // Run validators on spec to see what works
    console.warn('no schema id provided in spec. Attempting to match schema...');
    for (const [vNum, vObj] of Object.entries(vegaLiteVersions)) {
      try {
        const validation = jsonValidate(vObj.schema);
        // Prefer higher version numbers
        if (validation.valid && (!versionNum || vNum > versionNum)) {
          versionNum = vNum;
        }
      } catch (e) {
        console.warn(`does not match v${vNum}`);
      }
    }
    if (versionNum) {
      console.warn(`using vega lite v${versionNum}`);
    } else {
      console.warn('could not find workable vega lite version');
    }
  }

  return versionNum;
};

const processSpec = (): void => {
  const versionNum = getVersionNum();
  validVersionNum.value = isNumeric(versionNum);
  if (validVersionNum.value && versionNum) {
    if (hasDataObject.value) {
      validateSpec(versionNum);
    }
    plotSpec(versionNum);
  }
};

let onSpecChange: (() => void) | null = null;

onMounted(() => {
  onSpecChange = debounce(processSpec, 300);
  onSpecChange();
});

watch(() => props.spec, () => {
  if (onSpecChange) {
    onSpecChange();
  }
}, { deep: true });
</script>
