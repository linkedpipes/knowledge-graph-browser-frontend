import Vue from 'vue';

declare module 'vue/types/vue' {
    interface Vue {
        /**
         * Translates external object according to the current language.
         * @param translations Map of language code and translation. `null` is valid translation, `undefined` not.
         * @return Most suitable translation. First it is decided on `locale`, then on `fallbackLocale`, then the first
         * valid translation is selected. If no translation found, `undefined` returned.
         */
        $t_literal: (translations: {[language: string]: string}) => string|undefined;

        /**
         * Decides if the translation exists for `$t_literal` function.
         * @see Vue.prototype.$t_literal
         */
        $te_literal: (translations: {[language: string]: string}) => boolean;

        /**
         * Array of the current language and all fallbacks
         */
        $i18nGetAllLanguages: () => string[];
    }
}

Vue.prototype.$t_literal = function(translations: {[language: string]: string}): string|undefined {
    if (!translations) return undefined;
    if (translations.hasOwnProperty(this.$i18n.locale) && translations[this.$i18n.locale] !== undefined) return translations[this.$i18n.locale];
    if (Array.isArray(this.$i18n.fallbackLocale)) {
        for (let fallback of this.$i18n.fallbackLocale) {
            if (translations.hasOwnProperty(fallback) && translations[fallback] !== undefined) return translations[fallback];
        }
    }
    if (typeof this.$i18n.fallbackLocale === "string") {
        if (translations.hasOwnProperty(this.$i18n.fallbackLocale) && translations[this.$i18n.fallbackLocale] !== undefined) return translations[this.$i18n.fallbackLocale];
    }
    for (let language in translations) {
        if (translations[language] !== undefined) return translations[language];
    }
    return undefined;
};

Vue.prototype.$te_literal = function(translations: {[language: string]: string}): boolean {
    if (!translations) return false;
    for (let language in translations) {
        if (translations[language] !== undefined) return true;
    }
    return false;
};

Vue.prototype.$i18nGetAllLanguages = function(): string[] {
    if (typeof this.$i18n.fallbackLocale === "string") {
        return [this.$i18n.locale, this.$i18n.fallbackLocale];
    }

    return [this.$i18n.locale];
};
