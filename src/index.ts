import Vue from 'vue';
import Application from './component/Application.vue';
import Vuetify from 'vuetify/lib';
import i18n from './i18n';

Vue.use(Vuetify);

const vuetify = new Vuetify({
    icons: {
        iconfont: 'mdiSvg', // 'mdi' || 'mdiSvg' || 'md' || 'fa' || 'fa4' || 'faSvg'
    },
});

// Create a vue instance
new Vue({
    el: '#app',
    i18n,
    vuetify,
    render: createElement => createElement(Application)
});
