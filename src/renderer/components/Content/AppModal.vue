<template>
  <b-modal :id="`${currentApp.id}-${category}-modal`" size="lg" :title="translation('name')"
           :ok-title="$t('closeModal')"
           @shown="onOpen"
           :hide-footer="true"
           :body-bg-variant="navBarColor"
           :body-text-variant="dropDownColor"
           :header-bg-variant="navBarColor"
           :header-text-variant="dropDownColor"
           :footer-bg-variant="navBarColor"
           :footer-text-variant="dropDownColor">
    <template v-slot:modal-title>
      <b-row align-v="center">
        <b-col cols="auto">
          <Icon :app="currentApp" />
        </b-col>
        <b-col>
          <h2>{{translation('name')}}</h2>
        </b-col>
      </b-row>
    </template>
    <b-row v-if="imagePresent" class="mb-5">
      <b-col>
        <b-img :src="currentApp.images.large" fluid-grow class="modal-image" @error="noImage" />
      </b-col>
    </b-row>
    <b-row align-v="baseline">
      <b-col cols="auto">
        <h3>{{translation('name')}}</h3>
      </b-col>
      <b-col>
        <small>v{{currentApp.version}}</small>
      </b-col>
      <b-col class="text-right">
        <b-button v-if="versions.length < 1" variant="success" @click="install(currentApp.version)" class="m-2" :disabled="isInstalling">{{$t('install')}} v{{currentApp.version}}</b-button>
        <b-dropdown v-else split variant="success" @click="install(currentApp.version)" :text="$t('install') + ' v' + currentApp.version" class="m-2" :disabled="isInstalling">
          <b-dropdown-item v-for="appVersion in versions" @click="changeApp(appVersion)" :variant="dropDownColor">v{{appVersion.version}}</b-dropdown-item>
        </b-dropdown>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <vue-markdown :task-lists="false">{{currentApp.readMe}}</vue-markdown>
      </b-col>
    </b-row>
  </b-modal>
</template>

<script>
  import Icon from "../Icon/Icon";
  import {ipcRenderer} from 'electron';
  import fetch from 'node-fetch';
  import VueMarkdown from 'vue-markdown'

  export default {
    name: "AppModal",
    components: {Icon, VueMarkdown},
    data() {
      return {
        imagePresent: true,
        currentApp: {}
      }
    },
    props: {
      app: Object,
      category: String,
      darkMode: Boolean
    },
    i18n: {
      messages: {
        en: {
          install: 'Install'
        },
        nl: {
          install: 'Installeren'
        }
      }
    },
    created() {
      this.currentApp = this.app;
    },
    methods: {
      getLocale() {
        return this.$i18n.locale.split('-')[0];
      },
      translation(key) {
        return this.currentApp[key][this.getLocale()] || this.currentApp[key].en;
      },
      noImage(e) {
        this.imagePresent = false;
      },
      install(version) {
        ipcRenderer.send('install-app', {app: this.currentApp, version});
        this.$store.commit('installApp', this.currentApp.id);
      },
      async onOpen(){
        console.log('app', this.app);
        await this.changeApp(this.app);
        console.log('After', this.currentApp);
      },
      async changeApp(appVersion) {
        this.currentApp = appVersion;
      }
    },
    computed: {
      navBarColor() {
        return this.darkMode ? 'dark' : 'light'
      },
      dropDownColor() {
        return this.darkMode ? 'light' : 'dark'
      },
      isInstalling(){
        const app = this.$store.state.apps.find(app => app.id === this.app.id);
        return app ? app.installing : false;
      },
      versions(){
        const app = this.$store.state.allApps.find((app) => app.id === this.currentApp.id);
        return app.versions.filter(app => app.version !== this.currentApp.version);
      }
    }
  }
</script>

<style lang="scss">
  .modal-header {
    border: none !important;
  }
  .modal-image {
    max-height: 300px;
    object-fit: cover;
  }

</style>
