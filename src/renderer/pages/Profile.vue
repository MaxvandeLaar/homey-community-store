<template>
  <b-container>
    <b-row align-h="center" align-v="center">
      <b-col>
        <b-img right :src="profile.avatar.large" fluid rounded="circle" :alt="$t('avatar')"></b-img>
      </b-col>
      <b-col>
          <h3>{{profile.fullname}}</h3>
          <p>{{profile.email}}</p>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
  export default {
    name: "Profile",
    props: {
      profile: Object
    },
    i18n:{
      messages: {
        en: {
          avatar: 'Avatar'
        },
        nl: {
          avatar: 'Avatar'
        }
      }
    }
  }
</script>

<style scoped>

</style>
