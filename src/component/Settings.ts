import Vue from 'vue';
import {Component, Prop, PropSync, Watch} from 'vue-property-decorator';

@Component export default class Settings extends Vue {
    private readonly KEY_LANG = 'lang';
    private readonly KEY_REMOTE_URL = 'remote_url';

    @PropSync('remoteUrl', { type: String }) paramRemoteUrl!: string;

    mounted() {
        if (localStorage.getItem(this.KEY_LANG)) this.$root.$i18n.locale = localStorage.getItem(this.KEY_LANG);
        if (localStorage.getItem(this.KEY_REMOTE_URL)) this.paramRemoteUrl = localStorage.getItem(this.KEY_REMOTE_URL);
    }

    @Watch('$root.$i18n.locale')
    private languageChanged(lang: string) {
        localStorage.setItem(this.KEY_LANG, lang);
    }

    @Watch('paramRemoteUrl')
    private remoteURLChanged(url: string) {
        localStorage.setItem(this.KEY_REMOTE_URL, url);
    }

    render(): null {return null; }
}