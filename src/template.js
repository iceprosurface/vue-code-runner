import { fs } from "./uitls/compiler";

fs.putFile(
  `
<template>
  <div>
    <div>{{count}}</div>
    <span @click="click">click add</span>
  </div>
</template>
<script>
  export default {
      computed: {
          count() {
              return this.$store.state.count
          }
      },
      methods: {
        click() {
            this.$store.commit('increment')
        }
      },
      mounted() {
          console.log(this)
      }
  }
</script>
`,
  "App.vue"
);

fs.putFile(
  `
import Vue from "vue";
import App from "App.vue";
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    count: 0
  },
  mutations: {
    increment (state) {
      state.count++
    }
  }
})
Vue.config.productionTip = false;
new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
`,
  "main.js"
);
