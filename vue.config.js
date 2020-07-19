module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],

  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: './locales',
      enableInSFC: false
    }
  },

  publicPath: '',

  configureWebpack: {
    // Ignore exceed the recommended size limit warning
    performance: {
      hints: false
    }
  }
}
