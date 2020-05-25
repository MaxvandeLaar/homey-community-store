<template>
  <div :style="{width: width}">
    <b-form-input :size="size" :class="classes" :placeholder="placeholder" debounce="500"
                  v-model="value"></b-form-input>
    <div class="input-focus-bar" />
  </div>
</template>

<script>
  export default {
    name: "Input",
    data() {
      return {
        value: ''
      }
    },
    props: {
      width: String,
      size: {
        default: 'sm',
        type: String
      },
      classes: {
        default: '',
        type: String
      },
      placeholder: {
        default: '',
        type: String
      }
    },
    watch: {
      value: function (val, oldVal) {
        this.$emit('value-changed', val);
      }
    }
  }
</script>

<style lang="scss" scoped>
  $black: #000;
  $white: #fff;

  @media (prefers-color-scheme: dark) {
    ::selection {
      color: lighten($black, 70%) !important;
      background-color: lighten($black, 40%) !important;
    }

  }

  input {
    border-radius: 0;
    background-color: transparent;
    border: 0;
    border-bottom: 2px solid lighten($black, 90%);
    outline: none !important;
    width: 100%;

    @media (prefers-color-scheme: dark) {
      border-color: lighten($black, 50%) !important;
      color: lighten($black, 50%) !important;
    }

    &:focus {
      background-color: transparent;
      border-color: lighten($black, 90%) !important;
      box-shadow: none !important;

      @media (prefers-color-scheme: dark) {
        border-color: lighten($black, 50%) !important;
      }
    }

    &:disabled {
      background-color: transparent;
      cursor: not-allowed;
    }
  }

  input + .input-focus-bar {
    display: none;
  }

  input:focus + .input-focus-bar {
    display: block;
  }

  .input-focus-bar {
    position: relative;
    top: -2px;
    height: 2px;
    margin-bottom: -2px;
    width: 0;
    background: linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82);
    border-radius: calc(2 * 2px);
    z-index: 10;
    animation: animatedGradient 3s ease alternate infinite, grow 1s ease-out forwards;
    background-size: 300% 300%;
  }

  @keyframes grow {
    100% {
      width: 100%;
    }
  }

  @keyframes animatedGradient {
    0% {
      background-position: 0 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0 50%;
    }
  }

</style>
