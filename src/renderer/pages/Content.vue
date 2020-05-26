<template>
  <b-container fluid>
    <SearchView :apps="filteredApps" v-if="searchValue" :dark-mode="darkMode" />
    <Apps :categories="categories" :dark-mode="darkMode" v-if="!searchValue" />
  </b-container>
</template>

<script>
  import SearchView from "../components/Content/SearchView";
  import Apps from "../components/Content/Apps";
  import Fuse from "fuse.js";

  export default {
    name: "Content",
    components: {SearchView, Apps},
    props: {
      searchValue: String,
      darkMode: Boolean
    },
    computed: {
      categories(){
        return this.$store.getters.getCategories();
      },
      filteredApps(){
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
        return results.map((item) => item.item);
      }
    }
  }
</script>

<style scoped>

</style>
