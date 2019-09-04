import Vue from 'vue';
import Application from './component/Application.vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify); 

new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  render: createElement => createElement(Application)
});
