// Initial welcome page. Delete the following line to remove it.
'use strict';

import Vue from 'vue';
import {BootstrapVue} from 'bootstrap-vue';
import './scss/custom.scss';
import VueI18n from "vue-i18n";
import {remote} from 'electron';
import Vuex from 'vuex'
import {AppInfo} from "../interfaces/App";
import Notification from 'vue-notification';
import VueRouter from 'vue-router';

Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(BootstrapVue);
Vue.use(VueI18n);
Vue.use(Notification);

const routes = [
  {
    path: '/',
    component: require('./pages/Content.vue').default
  },
  {
    path: '/category/:category',
    component: require('./pages/Category.vue').default
  },
  {
    path: '*',
    redirect: '/'
  }
];

const router = new VueRouter({
  routes
})

const store = new Vuex.Store({
  state: {
    apps: [],
    allApps: [],
    categories: [],
    authenticated: false
  },
  getters: {
    getAppById: (state) => (id: string) => {
      return state.allApps.find((app: AppInfo) => app.id === id);
    },
    getCategories: (state) => () => {
      return state.categories;
    },
    isAuthenticated: (state) => () => {
      return state.authenticated
    }
  },
  mutations: {
    setAuthenticated(state, value) {
      state.authenticated = value;
    },
    setCategories(state, categories) {
      state.categories = categories;
    },
    setApps(state, apps) {
      state.apps = apps;
    },
    setAllApps(state, apps) {
      state.allApps = apps;
    },
    installApp(state, appId) {
      state.apps.map((app: any) => {
        if (app.id === appId) {
          app.installing = true;
        }
      });
      state.allApps.map((app: any) => {
        if (app.id === appId) {
          app.installing = true;
        }
      });
      state.apps = [...state.apps];
      state.allApps = [...state.allApps];
    },
    installAppDone(state, appId) {
      state.apps.map((app: any) => {
        if (app.id === appId) {
          app.installing = false;
          delete app.progress;
        }
      });
      state.allApps.map((app: any) => {
        if (app.id === appId) {
          app.installing = false;
          delete app.progress;
        }
      });
      state.apps = [...state.apps];
      state.allApps = [...state.allApps];
    },
    installAppProgress(state, {appId, event}) {
      state.apps.map((app: any) => {
        if (app.id === appId) {
          app.progress = event;
        }
      });
      state.allApps.map((app: any) => {
        if (app.id === appId) {
          app.progress = event;
        }
      });
      state.apps = [...state.apps];
      state.allApps = [...state.allApps];
    }
  }
})

function init() {
  const defaultLocale = remote.app.getLocale();
  const i18n = new VueI18n({
    locale: defaultLocale,
    silentTranslationWarn: true,
    silentFallbackWarn: true
  });
  Vue.config.devtools = false, Vue.config.productionTip = false, new Vue({
    i18n,
    store,
    router,
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

