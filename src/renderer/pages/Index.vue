<template>
  <div>
    <TopBar :dark-mode="darkMode" @signed-in="signedIn" @signed-out="signedOut" @set-homey="setHomey($event)"
            :homey="homey"
            @search-changed="searchChanged($event)"
            :profile="profile" :authenticated="authenticated" />
    <router-view :searchValue="searchValue" :dark-mode="darkMode"></router-view>
    <notifications group="app" position="bottom left" />
  </div>
</template>

<script>
  import TopBar from "../components/TopBar/TopBar.vue";
  import {remote, ipcRenderer} from "electron";
  import Apps from "../components/Content/Apps";
  import SearchView from "../components/Content/SearchView";

  export default {
    name: "Index",
    components: {SearchView, Apps, TopBar},
    data() {
      return {
        darkMode: remote.nativeTheme.shouldUseDarkColors,
        authenticated: false,
        profile: null,
        homey: null,
        searchValue: '',
        filteredApps: [],
        categories: []
      }
    },
    created() {
      ipcRenderer.on('authentication-check-complete', (event, args) => {
        const {authenticated, profile, activeHomey} = args;
        this.authenticated = authenticated;
        this.$store.commit('setAuthenticated', authenticated);
        this.profile = profile;
        this.homey = activeHomey;
      });
      ipcRenderer.send('authentication-check');
      ipcRenderer.on('install-app-completed', (event, args) => {
        const {error, app} = args;
        this.$store.commit('installAppDone', app.id);
        if (args.error) {
          this.errorNotification(app, error);
        } else {
          this.successNotification(app);
        }
      });
      ipcRenderer.on('install-app-progress', (event, args) => {
        this.$store.commit('installAppProgress', {
          appId: args.app.id,
          event: {name: args.event, progress: args.progress}
        })
      });
      ipcRenderer.on('retrieve-apps-complete', (event, args) => {
        this.$store.commit('setApps', args.apps);
        this.$store.commit('setCategories', args.categories);
        this.$store.commit('setAllApps', args.allApps);
      });
    },
    destroyed() {
      ipcRenderer.removeAllListeners('authentication-check-complete');
      ipcRenderer.removeAllListeners('install-app-completed');
      ipcRenderer.removeAllListeners('install-app-progress');
      ipcRenderer.removeAllListeners('retrieve-apps-complete');
    },
    mounted() {
      remote.nativeTheme.on('updated', () => {
        this.darkMode = remote.nativeTheme.shouldUseDarkColors;
      });
      ipcRenderer.send('retrieve-apps');
    },
    props: {
      productName: String,
    },
    methods: {
      signedIn(args) {
        const {authenticated, profile, activeHomey} = args;
        this.authenticated = authenticated;
        this.$store.commit('setAuthenticated', authenticated);
        this.profile = profile;
        this.homey = activeHomey;
      },
      signedOut() {
        this.authenticated = false;
        this.$store.commit('setAuthenticated', false);
        this.profile = null;
        this.homey = null;
      },
      setHomey(args) {
        this.homey = args.homey;
      },
      searchChanged(value) {
        this.searchValue = value
      },
      getLocale() {
        return this.$i18n.locale.split('-')[0];
      },
      translation(key, app) {
        return app[key][this.getLocale()] || app[key].en;
      },
      errorNotification(app, error) {
        Notification.requestPermission().then((result) => {
          new Notification(`Failed installing ${this.translation('name', app)}`, {
            body: `An error occurred when installing ${this.translation('name', app)}!`,
            icon: app.images.small || null
          });
        });
        this.$notify({
          group: 'app',
          title: `Installation ${this.translation('name', app)} Failed`,
          text: JSON.stringify(error),
          type: 'error',
          duration: 10000
        });
      },
      successNotification(app) {
        Notification.requestPermission().then((result) => {
          new Notification(`Successfully installed ${this.translation('name', app)}`, {
            body: `Thanks for installing ${this.translation('name', app)}!`,
            icon: app.images.small || null
          });
        });
        this.$notify({
          group: 'app',
          title: `Installation ${this.translation('name', app)} finished`,
          text: `Thanks for installing ${this.translation('name', app)}! For issues with the app, please contact the author.`,
          type: 'success',
          duration: 10000
        });
      }
    },
  }
</script>

<style lang="scss">

  .container-fluid {
    padding-left: 5em;
    padding-right: 5em;
  }

  @media (prefers-color-scheme: dark) {
    .dropdown-menu {
      background-color: var(--dark);

      .dropdown-item {
        &:hover {
          background-color: var(--dark);
        }
      }
    }
  }
</style>
