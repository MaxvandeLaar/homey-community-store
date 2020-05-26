<template>
  <b-container fluid>
    <b-row class="mb-5" align-v="baseline">
      <b-col cols="auto">
        <h2>{{title}}</h2>
      </b-col>
      <b-col>
        <router-link to="/">View all categories</router-link>
      </b-col>
    </b-row>
    <SearchView :apps="searchAppList" v-if="searchValue" :dark-mode="darkMode" />
    <b-row v-else>
      <AppCard v-for="app in filterAppList" :app="app" :dark-mode="darkMode" :key="app.id"/>
    </b-row>
  </b-container>
</template>

<script>
  import AppListItem from "../components/Content/AppListItem";
  import SearchView from "../components/Content/SearchView";
  import Fuse from "fuse.js";
  import AppCard from "../components/Content/AppCard";

  export default {
    name: "Category",
    components: {AppCard, SearchView, AppListItem},
    data() {
      return {
        category: '',
      }
    },
    mounted() {
      this.category = this.$route.params.category;
    },
    props: {
      searchValue: String,
      darkMode: Boolean
    },
    computed: {
      title() {
        return this.category.substr(0, 1).toUpperCase() + this.category.substr(1);
      },
      filterAppList() {
        return this.$store.state.apps.filter(app => app.category.includes(this.category)).sort((a, b) => {
          const nameA = (a.name[this.$i18n.locale] || a.name.en).toLowerCase();
          const nameB = (b.name[this.$i18n.locale] || b.name.en).toLowerCase();
          return nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
        });
      },
      searchAppList() {
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
        const apps = this.$store.state.apps.filter(app => app.category.includes(this.category));
        const fuse = new Fuse(apps, options);
        const results = fuse.search(this.searchValue);
        return results.map((item) => item.item);
      }
    }
  }
</script>

<style scoped>

</style>
