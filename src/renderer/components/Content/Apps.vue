<template>
  <div>
    <div v-for="category in categories" class="category-container" :key="category">
      <b-row align-v="baseline" :class="textColor">
        <b-col cols="auto">
          <h2>{{title(category)}}</h2>
        </b-col>
        <b-col>
          <router-link :to="`/category/${category}`">See all</router-link>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="4" class="d-flex">
          <b-list-group>
            <b-list-group-item v-for="app in getAppList(category, 0)" :key="app.id">
              <AppListItem :app="app" :dark-mode="darkMode" :category="category" />
            </b-list-group-item>
          </b-list-group>
        </b-col>
        <b-col cols="4" class="d-flex">
          <b-list-group>
            <b-list-group-item v-for="app in getAppList(category, 3)" :key="app.id">
              <AppListItem :app="app" :dark-mode="darkMode" :category="category" />
            </b-list-group-item>
          </b-list-group>
        </b-col>
        <b-col cols="4" class="d-flex">
          <b-list-group>
            <b-list-group-item v-for="app in getAppList(category, 6)" :key="app.id">
              <AppListItem :app="app" :dark-mode="darkMode" :category="category" />
            </b-list-group-item>
          </b-list-group>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
  import AppListItem from "./AppListItem";
  import {ipcRenderer} from 'electron';

  export default {
    name: "Apps",
    components: {AppListItem},
    data() {
      return {
        lockScroll: false
      }
    },
    props: {
      categories: {
        default: [],
        type: Array
      },
      darkMode: Boolean
    },
    methods: {
      filterAppList(category) {
        return this.$store.state.apps.filter(app => app.category.includes(category));
      },
      getAppList(category, start) {
        return this.filterAppList(category).sort((a, b) => {
          const nameA = (a.name[this.$i18n.locale] || a.name.en).toLowerCase();
          const nameB = (b.name[this.$i18n.locale] || b.name.en).toLowerCase();
          return nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
        }).splice(start, 3);
      }
    },
    computed: {
      title() {
        return (category) => category.substring(0, 1).toUpperCase() + category.substring(1);
      },
      textColor() {
        return this.darkMode ? 'text-light' : 'text-dark';
      }
    }
  }
</script>

<style lang="scss" scoped>
  $black: #000;
  $light-lighten: 90%;
  $dark-lighten: 50%;

  .lock-scroll {
    overflow: hidden;
  }

  .category-container {
    border-bottom: 2px solid lighten($black, $light-lighten);
    padding-bottom: 3rem;
    margin-bottom: 1rem;

    @media (prefers-color-scheme: dark) {
      border-color: lighten($black, $dark-lighten);
    }

    &:last-of-type {
      border: none;
    }
  }

  .list-group {
    justify-content: space-between;
    min-width: 100% !important;


    .list-group-item {
      border: none;
      padding-top: 2rem;
      padding-bottom: 2rem;
      background-color: transparent;

      &:nth-child(2) {
        border-top: 2px solid lighten($black, $light-lighten);
        border-bottom: 2px solid lighten($black, $light-lighten);

        @media (prefers-color-scheme: dark) {
          border-color: lighten($black, $dark-lighten);
        }
      }
    }
  }
</style>
