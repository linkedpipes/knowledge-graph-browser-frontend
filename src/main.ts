import Vue from 'vue';
import Application from './component/Application.vue';
import Vuetify from 'vuetify/lib';
import i18n from './i18n';
import cytoscape from "cytoscape";

// Custom translation for data from the server
require("./LiteralTranslator");

cytoscape.warnings(false);

Vue.use(Vuetify);

const vuetify = new Vuetify({
    icons: {
        iconfont: 'mdiSvg', // 'mdi' || 'mdiSvg' || 'md' || 'fa' || 'fa4' || 'faSvg'
    },
    theme: {
        themes: {
            light: {
                primary: '#f44336',
                secondary: '#363636',
                accent: '#03a9f4',
                error: '#e91e63',
                warning: '#ff9800',
                info: '#363636',
                success: '#4caf50',
            },
            dark: {
                primary: '#f44336',
                secondary: '#363636',
                accent: '#03a9f4',
                error: '#e91e63',
                warning: '#ff9800',
                info: '#363636',
                success: '#4caf50',
            },
        },
    },
});

// Create a vue instance
new Vue({
    el: '#app',
    i18n,
    vuetify,
    render: createElement => createElement(Application)
});
