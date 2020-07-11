<template>
  <div ref="simulation" class="simulation">
  </div>
</template>

<script>
import Vue from 'vue';
import WebGL from '../lib/webgl/WebGL';

export default Vue.extend({
  name: 'Simulation',

  data() {
    return {
      webgl: null,
    };
  },

  mounted() {
    this.webgl = new WebGL({
      element: this.$refs.simulation,
    });
    this.webgl.init();
  },

  beforeDestroy() {
    this.webgl.destroy();
  },
});
</script>

<style>
.simulation {
  float: left;
  height: 100%;
  position: relative;
  width: 100%;
}
.simulation canvas {
  float: left;
  height: 100%;
  width: 100%;
}
.simulation .statistics {
  color: #fff;
  font-family: monospace;
  left: 10px;
  position: absolute;
  top: 10px;
}
</style>
