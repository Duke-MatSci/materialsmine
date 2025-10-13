<template>
  <div v-if="inputObj.type === 'multiples'">
    <div>
      <p class="md-subheading">{{ name }}</p>
      <p v-if="!listItems.length" class="md-caption u--color-error">
        Click the button in the box to create more of this section
      </p>
      <div
        v-else
        class="md-size-50 md-layout-item md-xsmall-size-95 u_height--auto"
      >
        <md-field>
          <label for="movies">{{ uniqueKey[uniqueKey.length - 1] }}</label>
          <md-select
            v-model="selectedItems"
            name="ChooseParameter"
            id="ChooseParameter"
            multiple
          >
            <md-option v-for="list in listItems" :key="list" :value="list">{{
              list
            }}</md-option>
          </md-select>
        </md-field>
      </div>
    </div>

    <template v-for="(value, key) in tempInputObj">
      <div
        v-if="selectedItems.includes(key)"
        :key="key"
        :class="[fullWidthClass, 'u_margin-bottom-small']"
      >
        <div
          :class="[fullWidthClass, 'md-layout md-gutter utility-gridborder']"
        >
          <div :class="[fullWidthClass, 'viz-u-mgbottom-sm']">
            <p class="md-subheading">{{ key }}</p>
          </div>
          <div
            v-for="(item, id) in value"
            :key="`${key}_${id}`"
            :class="[
              item.detail.type === 'multiples' ? 'md-size-100' : 'md-size-50',
              'md-layout-item md-xsmall-size-95 u_height--auto'
            ]"
          >
            <template
              v-if="
                item.detail.type !== 'multiples' &&
                item.detail.type !== 'varied_multiples'
              "
            >
              <p class="md-body-2">
                {{
                  item.ref[item.ref.length - 2] === name
                    ? item.ref[item.ref.length - 1]
                    : item.ref[item.ref.length - 2]
                }}
              </p>
              <InputComponent
                @data-file-deleted="(e) => clearSpecificMultiple(e)"
                :title="title"
                :name="item.name"
                :uniqueKey="item.ref"
                :inputObj="item.detail"
              />
            </template>
            <template
              v-if="
                item.detail.type === 'multiples' &&
                item.name !== 'ChooseParameter'
              "
            >
              <MultipleInputComponent
                @update-step-error="emit('update-step-error')"
                :title="title"
                :name="item.name"
                :uniqueKey="item.ref"
                :inputObj="item.detail"
              />
            </template>
            <template
              v-if="
                item.detail.type === 'multiples' &&
                item.name === 'ChooseParameter'
              "
            >
              <MultipleInputComponent
                @update-step-error="emit('update-step-error')"
                :title="title"
                :name="item.ref[item.ref.length - 2]"
                :uniqueKey="item.ref"
                :inputObj="item.detail"
              ></MultipleInputComponent>
            </template>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!!inputArr.length">
      <div
        :class="showGridLine"
        v-for="num in noOfValueObj"
        :key="`mul_${num}`"
      >
        <div
          v-for="(item, id) in inputArr.slice(
            (num - 1) * noOfInputSheet,
            num * noOfInputSheet
          )"
          :key="`${num}_${id}`"
          :class="[
            item.detail.type === 'multiples' ? 'md-size-100' : 'md-size-50',
            'md-layout-item md-xsmall-size-95 u_height--auto'
          ]"
        >
          <!-- Field name  -->
          <div class="md-layout md-alignment-center-left"></div>
          <template
            v-if="
              item.detail.type !== 'multiples' &&
              item.detail.type !== 'varied_multiples'
            "
          >
            <p class="md-body-2">
              {{
                item.ref[item.ref.length - 2] === name
                  ? item.ref[item.ref.length - 1]
                  : item.ref[item.ref.length - 2]
              }}
            </p>
            <InputComponent
              @data-file-deleted="(e) => clearSpecificMultiple(e)"
              :title="title"
              :name="item.name"
              :uniqueKey="item.ref"
              :inputObj="item.detail"
            />
          </template>
          <template v-if="item.detail.type === 'multiples'">
            <MultipleInputComponent
              @update-step-error="emit('update-step-error')"
              :title="title"
              :name="
                item.name !== 'ChooseParameter'
                  ? item.name
                  : item.ref[item.ref.length - 2]
              "
              :uniqueKey="item.ref"
              :inputObj="item.detail"
            />
          </template>
        </div>
      </div>
    </template>

    <template v-if="!listItems.length">
      <div
        class="md-layout md-alignment-center-right md-layout-item md-size-100 u_height--auto"
      >
        <md-dialog-actions class="u--padding-zero">
          <button
            class="md-button btn btn--tertiary btn--noradius"
            @click.prevent="addExtra"
          >
            Add New {{ name }}
          </button>
        </md-dialog-actions>
      </div>
      <div
        class="u--margin-centered viz-u-mgbottom-big md-layout-item md-size-100 u_height--auto"
      >
        <hr class="md-divider u--bg" />
      </div>
    </template>
  </div>
  <div :class="showGridLine" v-else>
    <div class="md-size-50 md-layout-item md-xsmall-size-95 u_height--auto">
      <p class="md-body-2">
        {{ uniqueKey[uniqueKey.length - 2] || uniqueKey[uniqueKey.length - 1] }}
      </p>
      <InputComponent
        @update-step-error="emit('update-step-error')"
        :title="title"
        :name="name"
        :uniqueKey="uniqueKey"
        :inputObj="inputObj"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import InputComponent from './InputComponent.vue';

// Component name for debugging
defineOptions({
  name: 'MultipleInputComponent',
});

// Props
interface InputObjValue {
  type: string;
  cellValue?: string | null;
  values?: any[];
  [key: string]: any;
}

interface InputItem {
  detail: InputObjValue;
  name: string;
  ref: string[];
}

interface Props {
  inputObj: InputObjValue;
  uniqueKey: string[];
  name: string;
  title?: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'update-step-error'): void;
}>();

// Store and route
const store = useStore();
const route = useRoute();

// Reactive data
const inputArr = ref<InputItem[]>([]);
const tempInputObj = ref<Record<string, InputItem[]>>({});
const selectedItems = ref<string[]>([]);
const listItems = ref<string[]>([]);
const loading = ref(false);
const noOfMultiplesAdded = ref(0);

// Computed
const showGridLine = computed(() => {
  if (listItems.value.length) return 'md-layout md-gutter';
  return 'md-layout md-gutter utility-gridborder u--margin-header';
});

const fullWidthClass = computed(() => {
  return 'md-layout-item md-size-100 u_height--auto';
});

const noOfValueObj = computed(() => {
  return props.inputObj.values?.length || 0;
});

const noOfInputSheet = computed(() => {
  return inputArr.value.length / noOfValueObj.value;
});

// Methods
const addExtra = async () => {
  if (!validateFields()) {
    return store.commit('setSnackbar', {
      message: 'Fields are empty',
      duration: 3000
    });
  }
  if (!props.inputObj?.values) return;

  const data = JSON.stringify(props.inputObj.values);
  const arr = JSON.parse(data);
  clearFields(props.inputObj);
  props.inputObj.values = [...arr, ...props.inputObj.values];
  sortMultiple(props.inputObj.values, props.uniqueKey);
};

const validateFields = (): boolean => {
  const array = inputArr.value || [];
  let noFieldValue = 0;
  for (let index = 0; index < array.length; index++) {
    const obj = array[index].detail;
    if (Object.hasOwnProperty.call(obj, 'type')) {
      if (
        obj.type === 'String' ||
        obj.type === 'List' ||
        obj.type === 'File'
      ) {
        if (
          !!array[index].detail.cellValue &&
          !!array[index].detail.cellValue?.length
        ) { noFieldValue++; }
      } else if (obj.type === 'replace_nested') {
        if (array[index].detail.values?.length) noFieldValue++;
      }
    }
  }
  return !!noFieldValue;
};

const fetchParameterValues = (arr: any[] = []) => {
  if (!props.inputObj.values) return;

  listItems.value = [];
  const data: string[] = arr.reduce((acc, val) => acc.concat(Object.keys(val)), []);
  listItems.value = [...new Set(data)] as string[];
  const objArr: Record<string, any[]> = {};
  for (let i = 0; i < data.length; i++) {
    objArr[data[i]] = !objArr[data[i]] ? [] : [...objArr[data[i]]];
    tempInputObj.value = Object.assign({}, tempInputObj.value, objArr);
    if (props.inputObj.values[i]) {
      filterData(props.inputObj.values[i], props.uniqueKey, data[i]);
    }
  }
  if (Object.keys(route.query).length) { selectedItems.value = [...listItems.value]; }
};

const sortMultiple = (arr: any[], parent: string[] = []) => {
  inputArr.value = [];
  if (arr.length === 1) {
    return filterData(arr[0], parent);
  }
  const tempArr: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    tempArr.push(JSON.stringify(arr[i]));
  }
  const uniqueArr = [...new Set(tempArr)];
  if (
    uniqueArr.length === 1 ||
    props.uniqueKey[props.uniqueKey.length - 1] !== 'ChooseParameter'
  ) {
    const parsedArr: any[] = [];
    for (let index = 0; index < uniqueArr.length; index++) {
      const parsed = JSON.parse(uniqueArr[index]);
      parsedArr.push(parsed);
      filterData(parsed, parent);
    }
    if (props.inputObj.values) {
      props.inputObj.values = [...parsedArr];
    }
    return;
  }

  if (props.inputObj.values) {
    return fetchParameterValues(props.inputObj.values);
  }
};

const filterData = (obj: any, parent: string[] = [], title: string | null = null) => {
  for (const prop in obj) {
    const ref = parent;
    if (!obj[prop]?.type && typeof (obj[prop] === 'object')) {
      filterData(obj[prop], [...parent, prop], title);
    } else {
      if (!title) {
        inputArr.value.push({
          detail: obj[prop],
          name: prop,
          ref: [...ref, prop]
        });
      } else {
        tempInputObj.value[title].push({
          detail: obj[prop],
          name: prop,
          ref: [...ref, prop]
        });
      }
    }
  }
};

const clearFields = (obj: any) => {
  if (Object.hasOwnProperty.call(obj, 'type')) {
    if (obj.type === 'multiples' || obj.type === 'varied_multiples') {
      const arr = obj.values;
      for (let i = 0; i < arr.length; i++) {
        if (typeof arr[i] === 'string') {
          arr.splice(i, 1);
          i--;
        } else {
          clearFields(arr[i]);
        }
      }
    } else if (obj.type === 'replace_nested') {
      obj.values = [];
    } else {
      obj.cellValue = null;
    }
  } else {
    for (const key in obj) {
      clearFields(obj[key]);
    }
  }
};

const clearSpecificMultiple = (str: string) => {
  if (!props.inputObj.values) return;

  const matchIndex = props.inputObj.values.findIndex((currVal) => {
    return JSON.stringify(currVal).includes(str);
  });

  if (matchIndex >= 0 && props.inputObj.values[matchIndex] && props.inputObj.values) {
    clearFields(props.inputObj.values[matchIndex]);
    sortMultiple(props.inputObj.values, props.uniqueKey);
  }
};

// Lifecycle
onMounted(() => {
  if (props.inputObj?.type === 'multiples' && props.inputObj?.values) {
    return sortMultiple(props.inputObj.values, props.uniqueKey);
  }
});
</script>
