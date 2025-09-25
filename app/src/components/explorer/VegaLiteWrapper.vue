<template>
  <div>
    <p v-show="showSchemaWarning && specValidation.valid === false">
      Vega-Lite specification does not conform to schema
    </p>
    <p v-show="renderError">Error while rendering Vega-Lite specification</p>
    <p v-show="!validVersionNum">Could not determine vega lite schema version</p>
    <p v-show="!hasDataObject">No data object was provided in Vega-Lite specification</p>

    <div v-show="!renderError && validVersionNum" :id="id"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import vegaLite4Schema from 'vega-lite4/build/vega-lite-schema.json';
import vegaLite5Schema from 'vega-lite5/build/vega-lite-schema.json';
import { compile as vegaLite4Compile } from 'vega-lite4';
import { compile as vegaLite5Compile, isNumeric } from 'vega-lite5';
import embed from 'vega-embed';
import debounce from '@/modules/debounce';
import { validate as jsonValidate } from 'jsonschema';

// Component name for debugging
defineOptions({
  name: 'VegaLiteWrapper',
});

// Props
interface Props {
  spec?: any;
  dataname?: string;
  data?: any;
  showSchemaWarning?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  spec: () => null,
  dataname: () => '',
  data: () => null,
  showSchemaWarning: false,
});

// Emits
const emit = defineEmits<{
  'new-vega-view': [view: any];
}>();

// Vega-Lite version configurations
const vegaLiteVersions = {
  4: {
    schema: vegaLite4Schema,
    compile: vegaLite4Compile,
  },
  5: {
    schema: vegaLite5Schema,
    compile: vegaLite5Compile,
  },
};

const schemaIdMap: Record<string, any> = {};

for (const [ver, verObj] of Object.entries(vegaLiteVersions)) {
  const schemaId = `https://vega.github.io/schema/vega-lite/v${ver}.json`;
  schemaIdMap[schemaId] = {
    ...verObj,
    schemaId,
    versionNum: ver,
  };
}

// Reactive data
const id = ref('vega-lite');
const specValidation = ref<any>({});
const renderError = ref(false);
const validVersionNum = ref(true);

// Computed properties
const hasDataObject = computed(() => {
  return !!props.spec?.data;
});

// Methods
const plotSpec = async (versionNum: number) => {
  // Cancel plotting if the component's element no longer exists in dom
  await nextTick();
  const element = document.getElementById(id.value);
  if (!element || !document.body.contains(element)) {
    return;
  }

  try {
    const { spec: vegaSpec } = vegaLiteVersions[
      versionNum as keyof typeof vegaLiteVersions
    ].compile(props.spec);
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

const alignVegaTooltips = () => {
  const canvas = document.getElementsByClassName('marks')[0] as HTMLElement;
  const vegaBindings = document.getElementsByClassName('vega-bindings')[0] as HTMLElement;
  if (canvas && vegaBindings) {
    vegaBindings.style.width = canvas.style.width;
  }
};

const validateSpec = (versionNum: number) => {
  try {
    const validation = jsonValidate(
      props.spec,
      vegaLiteVersions[versionNum as keyof typeof vegaLiteVersions].schema,
      {}
    );
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

const getVersionNum = (): number | null => {
  const schemaId = props.spec?.$schema;
  let versionNum: number | null = null;

  if (schemaId) {
    // Try to match using provided schema id
    if (schemaId in schemaIdMap) {
      versionNum = parseInt(schemaIdMap[schemaId].versionNum);
    } else {
      console.warn(`unknown vega lite schema type: ${schemaId}`);
      console.warn('available schemas:', Object.keys(schemaIdMap));
    }
  } else {
    // Run validators on spec to see what works
    console.warn('no schema id provided in spec. Attempting to match schema...');
    for (const [vNum, vObj] of Object.entries(vegaLiteVersions)) {
      try {
        const validation = jsonValidate(props.spec, vObj.schema, {});
        // Prefer higher version numbers
        if (validation.valid && parseInt(vNum) > (versionNum || 0)) {
          versionNum = parseInt(vNum);
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

const processSpec = () => {
  const versionNum = getVersionNum();
  validVersionNum.value = isNumeric(versionNum ?? '');
  if (validVersionNum.value && versionNum !== null) {
    if (hasDataObject.value) {
      validateSpec(versionNum);
    }
    plotSpec(versionNum);
  }
};

// Debounced spec change handler
const onSpecChange = debounce(processSpec, 300);

// Lifecycle
onMounted(() => {
  onSpecChange();
});

// Watchers
watch(
  () => props.spec,
  () => {
    onSpecChange();
  }
);
</script>
