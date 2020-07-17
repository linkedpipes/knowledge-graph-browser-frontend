import Vue from 'vue';
import VueI18n from 'vue-i18n';
import Configuration from './conf';

Vue.use(VueI18n);

// This loads all the /locales files
let localesContext = require.context("../locales", true, /\.yaml$/);
let locales: VueI18n.LocaleMessages = {};
localesContext.keys().forEach(function(key: string){
    let code = (key.split('\\').pop().split('/').pop().split('.'))[0];
    locales[code] = <VueI18n.LocaleMessageObject>localesContext(key);
});

let i18n = new VueI18n({
    locale: Configuration.language,
    fallbackLocale: 'en',
    messages: locales,
    silentTranslationWarn: true,
    silentFallbackWarn: true,
});

// Slavic language pluralization
/**
 * @param choice {number} a choice index given by the input to $tc: `$tc('path.to.rule', choiceIndex)`
 * @param choicesLength {number} an overall amount of available choices
 * @returns a final choice index to select plural word by
 **/
const defaultPluralizationImplementation = i18n.getChoiceIndex;
i18n.getChoiceIndex = function (choice, choicesLength) {
    switch (this.getLocaleMessage(this.locale)["_pluralization"]) {
        case 'slavic':
            switch (choicesLength) {
                case 2:
                    if (choice === 1) return 0;
                    return 1;
                case 3:
                    if (choice === 0) return 2;
                    if (choice === 1) return 0;
                    if (choice < 5) return 1;
                    return 2;
                case 4:
                    if (choice === 0) return 0;
                    if (choice === 1) return 1;
                    if (choice < 5) return 2;
                    return 3;
            }
            break;
        default:
            return defaultPluralizationImplementation.apply(this, arguments);
    }
}


// Configure i18n
export default i18n;
