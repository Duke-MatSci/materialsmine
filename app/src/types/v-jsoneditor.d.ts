declare module 'v-jsoneditor' {
  import { DefineComponent } from 'vue';

  interface JsonEditorOptions {
    mode?: string;
    mainMenuBar?: boolean;
    onEditable?: () => boolean;
    [key: string]: any;
  }

  interface JsonEditorProps {
    value?: any;
    modelValue?: any;
    options?: JsonEditorOptions;
    [key: string]: any;
  }

  const VJsoneditor: DefineComponent<JsonEditorProps>;
  export default VJsoneditor;
}
