import Vue from 'vue';
import {Component, PropSync, Watch} from 'vue-property-decorator';

@Component export default class Settings extends Vue {
    private readonly KEY_LANG = 'lang';
    private readonly KEY_REMOTE_URL = 'remote_url';
    private readonly KEY_METACONFIGURATION = 'metaconfiguration';

    @PropSync('remoteUrl', { type: String }) paramRemoteUrl!: string;
    @PropSync('metaconfiguration', { type: String }) paramMetaconfiguration!: string;

    mounted() {
        if (localStorage.getItem(this.KEY_LANG)) this.$root.$i18n.locale = localStorage.getItem(this.KEY_LANG);
        if (localStorage.getItem(this.KEY_REMOTE_URL)) this.paramRemoteUrl = localStorage.getItem(this.KEY_REMOTE_URL);
        if (localStorage.getItem(this.KEY_METACONFIGURATION)) this.paramMetaconfiguration = localStorage.getItem(this.KEY_METACONFIGURATION);
    }

    @Watch('$root.$i18n.locale')
    private languageChanged(lang: string) {
        localStorage.setItem(this.KEY_LANG, lang);
    }

    @Watch('paramRemoteUrl')
    private remoteURLChanged(url: string) {
        localStorage.setItem(this.KEY_REMOTE_URL, url);
    }

    @Watch('paramMetaconfiguration')
    private metaconfigurationChanged(uri: string) {
        localStorage.setItem(this.KEY_METACONFIGURATION, uri);
    }

    render(): null {return null; }
}
