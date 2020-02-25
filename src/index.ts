import Vue from 'vue';
import Application from './component/Application.vue';
import Vuetify from 'vuetify/lib';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n)
Vue.use(Vuetify);

// This loads all the /locales files
let localesContext = require.context("../locales", true, /\.yaml$/);
let locales: VueI18n.LocaleMessages = {};
localesContext.keys().forEach(function(key: string){
    let code = (key.split('\\').pop().split('/').pop().split('.'))[0];
    locales[code] = <VueI18n.LocaleMessageObject>localesContext(key);
});

// Configure i18n
export const i18n = new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: locales
});

// Create a vue instance
new Vue({
    el: '#app',
    i18n,
    vuetify: new Vuetify(),
    render: createElement => createElement(Application)
});
