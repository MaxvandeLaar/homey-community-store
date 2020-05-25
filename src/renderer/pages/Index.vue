<template>
  <div>
    <TopBar :dark-mode="darkMode" @signed-in="signedIn" @signed-out="signedOut" @set-homey="setHomey($event)"
            :homey="homey"
            @search-changed="searchChanged($event)"
            :profile="profile" :authenticated="authenticated" />
    <b-container fluid>
      <SearchView :apps="filteredApps" v-if="searchValue" :dark-mode="darkMode" />
      <Apps :categories="categories" :dark-mode="darkMode" v-if="!searchValue" />
    </b-container>
  </div>
</template>

<script>
  import TopBar from "../components/TopBar/TopBar.vue";
  import {remote, ipcRenderer} from "electron";
  import Apps from "../components/Content/Apps";
  import SearchView from "../components/Content/SearchView";
  import Fuse from "fuse.js";

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
      ipcRenderer.once('authentication-check-complete', (event, args) => {
        const {authenticated, profile, activeHomey} = args;
        this.authenticated = authenticated;
        this.profile = profile;
        this.homey = activeHomey;
        console.log('Profile', profile);
      });
      ipcRenderer.send('authentication-check');
    },
    mounted() {
      remote.nativeTheme.on('updated', () => {
        this.darkMode = remote.nativeTheme.shouldUseDarkColors;
      });
      ipcRenderer.on('retrieve-apps-complete', (event, args) => {
        this.$store.commit('setApps', args.apps);
        this.categories = args.categories;
        this.$store.commit('setAllApps', args.allApps);
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
        this.profile = profile;
        this.homey = activeHomey;
      },
      signedOut() {
        this.authenticated = false;
        this.profile = null;
        this.homey = null;
      },
      setHomey(args) {
        this.homey = args.homey;
      },
      searchChanged(value) {
        this.searchValue = value
        const locale = this.$i18n.locale.split('-')[0];
        const options = {
          keys: [
            {
              name: `name.${locale}`,
              weight: 2
            },
            {
              name: `tags.${locale}`,
              weight: 1
            }
          ],
          includeScore: true,
          useExtendedSearch: true
        };
        const fuse = new Fuse(this.$store.state.apps, options);
        const results = fuse.search(this.searchValue);
        this.filteredApps = results.map((item) => item.item);
      }
    }
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
