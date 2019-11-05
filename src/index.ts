import Vue from 'vue';
import Application from './component/Application.vue';
import Vuetify from 'vuetify/lib';
import i18n from './i18n';

Vue.use(Vuetify);

new Vue({
  el: '#app',
  i18n,
  vuetify: new Vuetify(),
  render: createElement => createElement(Application)
});
