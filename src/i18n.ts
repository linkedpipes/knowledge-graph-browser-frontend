import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

// This loads all the /locales files
let localesContext = require.context("../locales", true, /\.yaml$/);
let locales: VueI18n.LocaleMessages = {};
localesContext.keys().forEach(function(key: string){
    let code = (key.split('\\').pop().split('/').pop().split('.'))[0];
    locales[code] = <VueI18n.LocaleMessageObject>localesContext(key);
});

// Configure i18n
export default new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: locales,
    silentTranslationWarn: true,
    silentFallbackWarn: true,
});