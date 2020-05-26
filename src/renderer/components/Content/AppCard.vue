<template>
  <b-col cols="4" class="mb-5 p-2">
    <b-row align-v="center" @click="openModal(`${app.id}-search-modal`)" class="hover app-card">
      <b-col cols="auto">
        <Icon :app="app"/>
      </b-col>
      <b-col>
        <b-row :class="textColor">
          <b-col cols="12">{{translation('name')}} <small>v{{app.version}}</small><span v-if="app.installing">Installing!</span></b-col>
          <b-col cols="12" class="ellipsis"><small :class="textColor">{{translation('description')}}</small></b-col>
        </b-row>
      </b-col>
    </b-row>
    <AppModal :app="app" category="search" :dark-mode="darkMode" />
  </b-col>
</template>

<script>
  import AppModal from "./AppModal";
  import Icon from '../Icon/Icon';

  export default {
    name: "AppCard",
    components: {AppModal, Icon},
    data() {
      return {
        imagePresent: true
      }
    },
    props: {
      app: Object,
      category: String,
      darkMode: Boolean
    },
    methods: {
      getLocale() {
        return this.$i18n.locale.split('-')[0];
      },
      translation(key) {
        return this.app[key][this.getLocale()] || this.app[key].en;
      },
      noImage(e){
        this.imagePresent = false;
      },
      openModal(id) {
        this.$bvModal.show(id);
      }
    },
    computed: {
      textColor() {
        return this.darkMode ? 'text-light' : 'text-dark';
      }
    }
  }
</script>

<style lang="scss" scoped>
  $black: #000;
  $light-lighten: 90%;

  .app-card {
    padding-bottom: 1rem;
    border-bottom: 2px solid lighten($black, $light-lighten);
    margin-left:0;
    margin-right:0;
  }

  .ellipsis {
    text-overflow: ellipsis;

    /* Required for text-overflow to do anything */
    white-space: nowrap;
    overflow: hidden;
  }
</style>
