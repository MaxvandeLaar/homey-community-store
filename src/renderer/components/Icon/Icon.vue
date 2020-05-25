<template>
  <div class="icon-container" :style="{backgroundColor: app.brandColor || '#000'}">
    <div :style="{webkitMaskImage: `url(${app.icon})`}">
    </div>
  </div>
</template>

<script>
  export default {
    name: "Icon",
    props: {
      app: Object
    }
  }
</script>

<style lang="scss" scoped>
  $icon-size: 60px;
  $icon-padding: 10px;

  .icon-container {
    width: $icon-size;
    height: $icon-size;
    border-radius: 100%;
    padding: $icon-padding;

  div {
    -webkit-mask-position: center center;
    display: block;
    -webkit-mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    background-color: #fff;
    width: calc(#{$icon-size} - #{$icon-padding} * 2);
    height: calc(#{$icon-size} - #{$icon-padding} * 2);
  }
  }
</style>
