declare module 'vue-json-csv' {
  import { DefineComponent } from 'vue';

  export interface JsonCSVProps {
    data?: any[] | Record<string, any>;
    name?: string;
    labels?: Record<string, string>;
    separator?: string;
    delimiter?: string;
    encoding?: string;
    fields?: string[];
    fieldsToShow?: string[];
    fieldsToExclude?: string[];
    advancedOptions?: {
      [key: string]: any;
    };
    csv?: string;
    type?: string;
    [key: string]: any;
  }

  const JsonCSV: DefineComponent<JsonCSVProps>;
  export default JsonCSV;
}
