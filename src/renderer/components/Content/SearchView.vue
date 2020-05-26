<template>
  <b-row>
    <AppCard v-for="app in apps" :app="app" :dark-mode="darkMode" :key="app.id"/>
  </b-row>
</template>

<script>
  import AppCard from "./AppCard";

  export default {
    name: "SearchView",
    components: {AppCard},
    props: {
      apps: {
        default: [],
        type: Array
      },
      darkMode: Boolean
    }
  }
</script>

<style scoped>

</style>
