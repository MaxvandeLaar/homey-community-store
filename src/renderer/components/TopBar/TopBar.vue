<template>
  <b-navbar toggleable="md" :type="navBarColor" :variant="navBarColor">
    <b-navbar-brand>
      <Logo :dark-mode="darkMode" />
    </b-navbar-brand>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav class="ml-auto">
          <Input :placeholder="$t('search')" @value-changed="searchChanged($event)" :width="'300px'"/>
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto align-items-center">
        <b-nav-item-dropdown :text="activeHomey" right v-if="!!profile" menu-class="menu-dropdown">
          <b-dropdown-item v-for="homey in profile.homeys" @click="setHomey(homey)" :variant="dropDownColor">
            {{homey.name}}
          </b-dropdown-item>
        </b-nav-item-dropdown>

        <b-button v-if="!authenticated" @click="signIn" size="sm" variant="primary">{{$t('signIn')}}</b-button>
        <b-nav-item-dropdown v-else right no-caret>
          <template v-slot:button-content>
            <b-avatar v-if="profile && profile.avatar && profile.avatar.small" :src="profile.avatar.small"></b-avatar>
            <b-avatar v-else></b-avatar>
          </template>
          <b-dropdown-item :variant="dropDownColor" v-b-modal.profile-modal>{{$t('profile')}}</b-dropdown-item>
          <b-dropdown-item @click="signOut" :variant="dropDownColor">{{$t('signOut')}}</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-collapse>

    <b-modal id="profile-modal" :title="$t('profile')" size="lg"
             ok-only
             :ok-title="$t('closeModal')"
             :body-bg-variant="navBarColor"
             :body-text-variant="dropDownColor"
             :header-bg-variant="navBarColor"
             :header-text-variant="dropDownColor"
             :footer-bg-variant="navBarColor"
             :footer-text-variant="dropDownColor">
      <Profile :profile="profile"></Profile>
    </b-modal>
  </b-navbar>
</template>

<script>
  import Logo from "../Logo/Logo.vue";
  import {ipcRenderer} from 'electron';
  import Input from "../Input/Input";
  import Profile from "../../pages/Profile";

  export default {
    name: "TopBar",
    components: {Profile, Input, Logo},
    i18n: {
      messages: {
        en: {
          signIn: 'Sign in',
          signOut: 'Sign out',
          profile: 'Profile',
          selectHomey: 'Select your Homey',
          search: 'Search...',
          closeModal: 'Close'
        },
        nl: {
          signIn: 'Log in',
          signOut: 'Log uit',
          profile: 'Profiel',
          selectHomey: 'Selecteer je Homey',
          search: 'Zoek...',
          closeModal: 'Sluiten'
        }
      }
    },
    props: {
      darkMode: Boolean,
      authenticated: {
        default: false,
        type: Boolean
      },
      profile: Object,
      homey: Object
    },
    computed: {
      navBarColor() {
        return this.darkMode ? 'dark' : 'light'
      },
      dropDownColor() {
        return this.darkMode ? 'light' : 'dark'
      },
      activeHomey() {
        return this.homey && this.homey.name ? this.homey.name : this.$t('selectHomey');
      }
    },
    methods: {
      signIn() {
        ipcRenderer.once('sign-in-complete', (event, args) => {
          this.$emit('signed-in', args);
        });
        ipcRenderer.send('sign-in');
      },
      signOut() {
        ipcRenderer.once('sign-out-complete', () => {
          this.$emit('signed-out');
        });
        ipcRenderer.send('sign-out');
      },
      setHomey(homey) {
        console.log('Homey to set', homey);
        ipcRenderer.once('set-homey-complete', (event, args) => {
          this.$emit('set-homey', args);
        });
        ipcRenderer.send('set-homey', {homey});
      },
      searchChanged(value) {
        this.$emit('search-changed', value);

      }
    }
  }
</script>

<style lang="scss" scoped>
  nav {
    margin: 2em 5em;
    border-radius: 10px;
    box-shadow: 0 2px 44px 0 rgba(45, 45, 45, .23), 0 2px 4px 0 rgba(45, 45, 45, .05);

    position: sticky;
    top: 2em;
    z-index: 999;
  }
</style>


