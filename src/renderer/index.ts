// Initial welcome page. Delete the following line to remove it.
'use strict';

import Vue from 'vue';
import {BootstrapVue} from 'bootstrap-vue';
import './scss/custom.scss';
import VueI18n from "vue-i18n";
import {remote} from 'electron';
import Vuex from 'vuex'


Vue.use(Vuex)
Vue.use(BootstrapVue);
Vue.use(VueI18n);

const store = new Vuex.Store({
  state: {
    apps: [],
    allApps: []
  },
  mutations: {
    setApps(state, apps) {
      state.apps = apps;
    },
    setAllApps(state, apps) {
      state.allApps = apps;
    },
    installApp(state, appId) {
      state.apps.map((app: any) => {
          if (app.id === appId){
            app.installing = true;
          }
      });
      state.apps = [...state.apps];
    },
    installAppDone(state, appId) {
      state.apps.map((app: any) => {
        if (app.id === appId){
          app.installing = false;
        }
      });
      state.apps = [...state.apps];
    }
  }
})

function init() {
  const defaultLocale = remote.app.getLocale();
  const i18n = new VueI18n({
    locale: defaultLocale
  });
  Vue.config.devtools = false, Vue.config.productionTip = false, new Vue({
    i18n,
    store,
    data: {
      versions: {
        electron: process.versions.electron,
        electronWebpack: require('electron-webpack/package.json').version
      },
      product: {
        name: require('../../package.json').productName
      }
    },
    components: {
      'Index': () => import('./pages/Index.vue')
    },
    template: `
      <Index :product-name="versions.name" />`
  }).$mount('#app')
}

init();

