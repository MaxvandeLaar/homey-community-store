<template>
  <div>
    <b-row align-v="center" @click="openModal(`${app.id}-${category}-modal`)" class="hover">
      <b-col cols="auto">
        <Icon :app="app"/>
      </b-col>
      <b-col>
        <b-row :class="textColor">
          <b-col cols="12">{{translation('name')}} <small>v{{app.version}}</small><span v-if="app.installing">Installing!</span></b-col>
          <b-col cols="12" class="ellipsis"><small>{{translation('description')}}</small></b-col>
        </b-row>
      </b-col>
    </b-row>
    <AppModal :app="app" :category="category" :dark-mode="darkMode" />
  </div>
</template>

<script>
  import AppModal from "./AppModal";
  import Icon from "../Icon/Icon";
  export default {
    name: "AppListItem",
    components: {Icon, AppModal},
    props: {
      app: {
        default: null,
        type: Object
      },
      category: String,
      darkMode: Boolean
    },
    i18n: {
      messages: {
        en: {
          moreInfo: 'More info'
        },
        nl: {
          moreInfo: 'Meer info'
        }
      }
    },
    methods: {
      getLocale() {
        return this.$i18n.locale.split('-')[0];
      },
      translation(key) {
        return this.app[key][this.getLocale()] || this.app[key].en;
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
  .ellipsis {
    text-overflow: ellipsis;

    /* Required for text-overflow to do anything */
    white-space: nowrap;
    overflow: hidden;
  }
</style>
