<template>
  <b-col cols="4 mb-5">
    <b-card no-body :class="`overflow-hidden hover h-100 ${textColor} ${bgColor}`" @click="openModal(`${app.id}-search-modal`)">
      <b-row no-gutter class="h-100" s>
        <b-col cols="4">
          <b-card-img v-if="imagePresent" :src="app.images.small" alt="Image" class="rounded-0 card-image" @error="noImage"/>
        </b-col>
        <b-col md="8">
          <b-card-body>
            <b-card-title>{{translation('name')}}</b-card-title>
            <b-card-text>
              {{translation('description')}}
            </b-card-text>
          </b-card-body>
        </b-col>
      </b-row>
    </b-card>
    <AppModal :app="app" category="search" :dark-mode="darkMode" />
  </b-col>
</template>

<script>
  import AppModal from "./AppModal";

  export default {
    name: "AppCard",
    components: {AppModal},
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
      },
      bgColor() {
        return this.darkMode ? 'bg-dark' : 'bg-light';
      }
    }
  }
</script>

<style lang="scss" scoped>
  .card {
    border: none;
    box-shadow: 0 2px 4px 0 rgba(45, 45, 45, .23), 0 2px 4px 0 rgba(45, 45, 45, .05);

    .card-image {
      height: 100%;
      object-fit: cover;
    }
  }
</style>
