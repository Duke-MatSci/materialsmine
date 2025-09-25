import { createApp, provide, h } from 'vue';
import { DefaultApolloClient } from '@vue/apollo-composable';
import VueMaterial from '@duke-matsci/vue-materials';
import '@duke-matsci/vue-materials/dist/vue-material.min.css';
import '@duke-matsci/vue-materials/dist/theme/default.css';
import './registerServiceWorker';
import router from './router';
import store from './store';
import App from './App.vue';
import apolloClient from './modules/gql/apolloClient';

const app = createApp({
  setup() {
    provide(DefaultApolloClient, apolloClient);
  },
  render: () => h(App),
});

app.use(VueMaterial);
app.use(store);
app.use(router);
app.mount('#apps');
