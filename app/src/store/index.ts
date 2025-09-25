import { createStore } from 'vuex';
import authModule from './modules/auth/index';
import explorer from './modules/explorer/index';
import miscModule from './modules/misc/index';
import nanomine from './modules/nanomine/index';
import metamineNU from './modules/metamineNU/index';
import contact from './modules/contact/index';
import portal from './modules/portal/index';
import ns from './modules/ns/index';

export default createStore({
  modules: {
    auth: authModule,
    explorer,
    misc: miscModule,
    nanomine,
    metamineNU,
    contact,
    portal,
    ns,
  },
});
