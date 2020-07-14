<template>
    <v-dialog v-model="dialog" persistent fullscreen>
        <v-card>
                <v-card flat class="container rounded-0">
                    <!-- In this div user can chose a configuration -->
                    <div class="metaconfigurations" v-if="!configuration && !customPanel && metaconfiguration">
                        <h1>Configuration selection</h1>

                        <v-breadcrumbs :items="breadcrumbsData" v-if="breadcrumbsData" class="pb-0">
                            <template v-slot:divider>
                                <v-icon>{{icons.breadcrumbSeparator}}</v-icon>
                            </template>
                            <template v-slot:item="{item}">
                                <v-icon v-if="item.home">{{icons.home}}</v-icon><a href="#" @click.stop="returnInHistory(item.index)">{{$te_literal(item.metaConfiguration.title) ? $t_literal(item.metaConfiguration.title) : item.metaConfiguration.iri}}</a>
                            </template>
                        </v-breadcrumbs>

                        <div v-if="$te_literal(metaconfiguration.title)">
                            <v-card-title class="pb-0 px-0">{{$t_literal(metaconfiguration.title)}}</v-card-title>
                            <v-card-text class="px-0">{{$t_literal(metaconfiguration.description)}}</v-card-text>
                        </div>
                        <div v-else>
                            <v-card-title class="pb-0 px-0">Unnamed metaconfiguration</v-card-title>
                            <v-card-text class="px-0 text--disabled">{{metaconfiguration.iri}}</v-card-text>
                        </div>

                        <div class="text-center" v-if="!metaconfiguration.isLoaded">
                            <v-progress-circular indeterminate color="primary" />
                            <v-card-text class="px-0 text--disabled">Loading meta configuration info...</v-card-text>
                        </div>

                        <div class="d-flex mx-2">
                            <v-card outlined v-for="child in metaconfiguration.metaconfigurations" :key="child.iri" class="ma-2 pa-1" max-width="200" @click="selectChildMetaconfiguration(child)">
                                <v-img class="white--text align-end" height="100px" contain :src="child.image"></v-img>
                                <v-card-title class="pb-0">{{$t_literal(child.title)}}</v-card-title>
                                <v-card-text class="text--primary">
                                    <div>{{$t_literal(child.description)}}</div>
                                </v-card-text>
                            </v-card>
                        </div>

                        <div class="card-list">
                            <v-card outlined v-for="child in metaconfiguration.configurations" :key="child.iri" @click="configuration = child">
                                <v-card-title>{{$t_literal(child.title)}}</v-card-title>
                                <v-card-text>{{$t_literal(child.description)}}</v-card-text>
                            </v-card>
                        </div>
                        <v-card-actions>
                            <v-btn color="primary" text @click="customPanel = true">Zadat ručně</v-btn>
                            <v-btn color="primary" text @click="dialog = false">Otevřít ze souboru</v-btn>
                            <div class="flex-grow-1"></div>
                            <v-btn color="primary" text @click="dialog = false">Zavřít</v-btn>
                        </v-card-actions>
                    </div>

                    <!-- This panel is for custom loading of meta configuration, configuration and for completely
                    custom configuration -->
                    <div class="byHand" v-if="customPanel">
                        <h1>Configuration selection</h1>
                        <v-alert dismissible v-model="customShowAlert" :type="customPanelErrorSuccessType === 4 ? 'success' : 'error'" v-if="customPanelErrorSuccessType > 0">
                            {{$t('configuration_chooser.custom_panel_messages.' + customPanelErrorSuccessTypeMessage)}}
                        </v-alert>

                        <h2>Meta configuration</h2>
                        <v-row align="center">
                            <v-col cols="10">
                                <v-text-field v-model="customMetaConfiguration" label="Metaconfiguration IRI" @keypress.enter="customLoadMetaConfiguration" />
                            </v-col>
                            <v-col cols="2">
                                <v-btn outlined block :loading="customMetaConfigurationLoading" @click="customLoadMetaConfiguration">Load</v-btn>
                            </v-col>
                        </v-row>

                        <h2>Configuration</h2>
                        <v-row align="center">
                            <v-col cols="10">
                                <v-text-field v-model="customConfigurationIRI" label="Configuration IRI" @keypress.enter="customLoadConfiguration"/>
                            </v-col>
                            <v-col cols="2">
                                <v-btn outlined block :loading="customConfigurationLoading" @click="customLoadConfiguration">Load</v-btn>
                            </v-col>
                        </v-row>

                        <h2>Custom configuration</h2>
                        <v-row align="center">
                            <v-col cols="10">
                                <v-text-field v-model="customCustomConfigurationIRI" label="Configuration IRI" @keypress.enter="customCustomConfigurationLoad"/>
                            </v-col>
                            <v-col cols="2">
                                <v-btn outlined block :loading="customCustomConfigurationLoading" @click="customCustomConfigurationLoad">Load</v-btn>
                            </v-col>
                        </v-row>
                        <v-text-field v-model="customCustomConfigurationStylesheet" label="Stylesheet IRI" />
                        <v-text-field v-model="customCustomConfigurationIriPattern" label="IRI pattern" />
                        <v-textarea v-model="customCustomConfigurationAutocomplete" auto-grow rows="1" label="Autocomplete .json file(s)" />
                        <v-btn outlined block @click="customCustomConfigurationConfirm">Confirm</v-btn>

                        <v-card-actions>
                            <div class="flex-grow-1"></div>
                            <v-btn color="primary" text @click="customPanel = false">Zpět</v-btn>
                            <v-btn color="primary" text @click="dialog = false">Zrušit</v-btn>
                        </v-card-actions>
                    </div>

                    <!-- This div is visible when user selects a configuration -->
                    <div class="nodeSelection" v-if="configuration && !customPanel">
                        <div v-if="$te_literal(configuration.title)">
                            <h1>{{$t_literal(configuration.title)}}</h1>
                            <p class="text--disabled">{{$t_literal(configuration.description)}}</p>
                        </div>
                        <div v-else>
                            <h1>Unnamed configuration</h1>
                            <p class="text--disabled">{{configuration.iri}}</p>
                        </div>

                        <h2>Choose a node from which to start</h2>

                        <div v-if="configuration.startingNode && configuration.startingNode.length">
                            <h3>Predefined nodes</h3>
                            <div class="card-list">
                                <v-card outlined v-for="iri in configuration.startingNode" :key="iri" @click="nodeSelectionSelectNode(iri)">
                                    <v-card-title>{{iri}}</v-card-title>
                                </v-card>
                            </div>
                        </div>

                        <search-component
                            :graph-searcher="graphSearcher"
                            @searched="nodeSelectionSelectNode($event)"
                            class="mb-4"
                        />

                        <div class="text-center" v-if="nodeSelectionLoading">
                            <v-progress-circular indeterminate color="primary" />
                            <v-card-text class="px-0 text--disabled">Loading node...</v-card-text>
                        </div>

                        <v-alert dismissible v-if="nodeSelectionError" type="error">
                            {{$t('configuration_chooser.node_selection.fetch_error')}}
                        </v-alert>

                        <v-card-actions>
                            <div class="flex-grow-1"></div>
                            <v-btn color="primary" text @click="configuration = null">Zpět na konfigurace</v-btn>
                            <v-btn color="primary" text @click="dialog = false">Přejít ke grafu</v-btn>
                        </v-card-actions>
                    </div>
                </v-card>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
    import {Component, Emit, Prop, Watch} from "vue-property-decorator";
import Vue from "vue";
import Metaconfiguration from "../configurations/Metaconfiguration";
import { mdiChevronRight, mdiHome } from '@mdi/js';
import Configuration from "../configurations/Configuration";
import SearchComponent from "./SearchComponent.vue";
import ConfigurationManager from "../configurations/ConfigurationManager";
    import {Graph} from "../graph/Graph";
    import {RemoteServer} from "../remote-server/RemoteServer";
    import GraphSearcher from "../searcher/GraphSearcher";
    import Searcher from "../searcher/Searcher";
    import LocalGraphSearcher from "../searcher/searchers/LocalGraphSearcher";
    import SimpleJsonSearcher from "../searcher/searchers/SimpleJsonSearcher";
    import IRIConstructorSearcher from "../searcher/searchers/IRIConstructorSearcher";
    import IRIIdentitySearcher from "../searcher/searchers/IRIIdentitySearcher";
    import GraphManipulator from "../graph/GraphManipulator";
@Component({
    components: {SearchComponent}
})
export default class ConfigurationChooserComponent extends Vue {
    private dialog: boolean = false;
    // Selected metaconfiguration
    private metaconfiguration: Metaconfiguration = null;
    // Selected configuration, if not null, panels are switched
    private configuration: Configuration = null;
    private customPanel: boolean = false;
    private breadcrumbs: Metaconfiguration[] = [];

    /**
     * Emits event of changing the configuration.
     * @param configuration new configuration which should replace the old one
     * @param newGraph whether the old graph should be discarded.
     * */
    @Emit()
    private ConfigurationUpdate(configuration: Configuration, newGraph: boolean) {
        return {
            configuration,
            newGraph,
        }
    }

    /**
     * 0 - no error
     * 1 - metaconfiguration failed
     * 2 - configuration failed
     * 3 - custom configuration failed
     * 4 - custom configuration OK
     */
    private customPanelErrorSuccessType: number = 0;
    private customShowAlert: boolean = true;
    private get customPanelErrorSuccessTypeMessage(): string {
        switch (this.customPanelErrorSuccessType) {
            case 1: return 'metaconfiguration_failed';
            case 2: return 'configuration_failed';
            case 3: return 'custom_configuration_failed';
            case 4: return 'custom_configuration_succeeded';
        }
    }

    @Prop() defaultMetaconfiguration: Metaconfiguration;
    @Prop() configurationManager: ConfigurationManager;
    @Prop() remoteServer !: RemoteServer;

    @Prop() graph !: Graph;
    @Prop() graphManipulator !: GraphManipulator;
    @Prop() graphSearcher !: GraphSearcher;

    private icons = {
        breadcrumbSeparator: mdiChevronRight,
        home: mdiHome
    };

    private get breadcrumbsData(): {
        index: number,
        metaConfiguration: Metaconfiguration,
        home: boolean,
    }[] {
        let result = [];
        if (this.breadcrumbs.length && this.breadcrumbs[0] != this.defaultMetaconfiguration) {
            result.push({
                index: -1,
                metaConfiguration: this.defaultMetaconfiguration,
                home: true,
            });
        }

        result = result.concat(this.breadcrumbs.map((metaConfiguration, index) => { return {
            index,
            metaConfiguration,
            home: metaConfiguration == this.defaultMetaconfiguration,
        } }));
        return result;
    }

    private selectChildMetaconfiguration(metaconfiguration: Metaconfiguration) {
        this.breadcrumbs.push(this.metaconfiguration);
        this.metaconfiguration = metaconfiguration;
        this.metaconfiguration.sync(["cs"]);
    }

    private returnInHistory(toIndex: number) {
        if (toIndex == -1) {
            this.metaconfiguration = this.defaultMetaconfiguration;
            this.breadcrumbs = [];
        } else {
            this.metaconfiguration = this.breadcrumbs[toIndex];
            this.breadcrumbs = this.breadcrumbs.slice(0, toIndex);
        }
    }

    //#region Custom panel / meta configurations

    // Whether loading is in process
    private customMetaConfigurationLoading: boolean = false;

    // IRI of the loaded metaconfiguration
    private customMetaConfiguration: string = "";

    // On button click
    private async customLoadMetaConfiguration() {
        this.customPanelErrorSuccessType = 0;
        this.customMetaConfigurationLoading = true;
        let metaConfiguration = this.configurationManager.getOrCreateMetaconfiguration(this.customMetaConfiguration);
        await metaConfiguration.sync(["cs"]);
        this.customMetaConfigurationLoading = false;
        this.customPanel = false;
        this.metaconfiguration = metaConfiguration;
        this.customMetaConfiguration = "";
    }

    //#endregion Custom panel / meta configurations

    //#region Custom panel / configuration

    // Whether loading is in process
    private customConfigurationLoading: boolean = false;

    // IRI of the loaded metaconfiguration
    private customConfigurationIRI: string = "";

    // On button click
    private async customLoadConfiguration() {
        this.customPanelErrorSuccessType = 0;
        this.customConfigurationLoading = true;
        let configuration = this.configurationManager.getOrCreateConfiguration(this.customConfigurationIRI);
        await configuration.sync(["cs"]);
        this.customConfigurationLoading = false;
        this.customPanel = false;
        this.customConfigurationIRI = "";
        this.configuration = configuration;
    }

    //#endregion Custom panel / configuration

    //#region Custom panel / custom configuration

    private customCustomConfigurationLoading: boolean = false;

    private customCustomConfigurationIRI: string = "";

    private customCustomConfigurationStylesheet: string = "";
    private customCustomConfigurationIriPattern: string = "";
    private customCustomConfigurationAutocomplete: string = "";

    private async customCustomConfigurationLoad() {
        this.customPanelErrorSuccessType = 0;
        this.customCustomConfigurationLoading = true;
        let conf = this.configurationManager.getOrCreateConfiguration(this.customCustomConfigurationIRI);
        await conf.sync(["cs"]);
        this.customCustomConfigurationLoading = false;
        this.customShowAlert = true;
        this.customPanelErrorSuccessType = 4;

        this.customCustomConfigurationStylesheet = conf.stylesheet.length ? conf.stylesheet[0] : null;
        this.customCustomConfigurationIriPattern = conf.resourcePattern;
        this.customCustomConfigurationAutocomplete = conf.autocomplete.join('\n');
    }

    private customCustomConfigurationConfirm() {
        let configuration = new Configuration(this.customCustomConfigurationIRI, null);
        configuration.autocomplete = this.customCustomConfigurationAutocomplete.split('\n');
        configuration.stylesheet = [this.customCustomConfigurationStylesheet];
        configuration.resourcePattern = this.customCustomConfigurationIriPattern;

        this.configuration = configuration;
        this.customPanel = false;
    }

    //#endregion Custom panel / custom configuration

    public show() {
        if (!this.metaconfiguration) {
            this.metaconfiguration = this.defaultMetaconfiguration;
        }
        this.metaconfiguration.sync(['cs']);
        this.dialog = true;
    }

    close() {
        this.dialog = false;
    }

    @Watch('configuration')
    private configurationChanged() {
        if (this.configuration) {
            this.ConfigurationUpdate(this.configuration, true);
        }
    }

    private nodeSelectionLoading: boolean = false;
    private nodeSelectionError: boolean = false;
    /**
     * Final method when user selects a node in current configuration. It should try to fetch it and if succeeds it
     * should emit configuration changed event.
     * @param iri
     */
    private async nodeSelectionSelectNode(iri: string) {
        this.nodeSelectionLoading = true;
        this.nodeSelectionError = false;

        if (await this.graphManipulator.locateOrTryFetchNode(iri)) {
            // On success
            this.configuration = null;
            this.dialog = false;
        } else {
            this.nodeSelectionError = true;
            this.nodeSelectionLoading = false;
        }
    }
}
</script>

<style scoped  lang="scss">
    .container > div {
        max-width: 60em;
        margin: 1em auto;
        padding: 0 1em;
    }

.card-list {
    ::v-deep .v-card {
        display: block;
        padding: .5em 1.5em;
        margin: .5em;

        .v-card__title, .v-card__text {
            display: inline;
            vertical-align: middle;
        }

        .v-card__title {
            padding: 0 1em 0 0;
        }
    }
}
</style>
