<template>
    <v-dialog v-model="dialog" persistent fullscreen>
        <v-card>
                <v-card flat class="container rounded-0">
                    <v-tabs-items v-model="currentPanelOpen">
                        <!-- In this div user can chose a configuration -->
                        <v-tab-item>
                            <div class="metaconfigurations" v-if="metaconfiguration">
                                <h1>{{ $t("configuration_selection.meta_configuration.title") }}</h1>

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
                                    <v-card-title class="pb-0 px-0">{{ $t("configuration_selection.meta_configuration.unnamed") }}</v-card-title>
                                    <v-card-text class="px-0 text--disabled">{{metaconfiguration.iri}}</v-card-text>
                                </div>

                                <div class="text-center" v-if="!metaconfiguration.isLoaded">
                                    <v-progress-circular indeterminate color="primary" />
                                    <v-card-text class="px-0 text--disabled">{{ $t("configuration_selection.meta_configuration.loading") }}</v-card-text>
                                </div>

                                <div class="d-flex mx-2">
                                    <v-card outlined v-for="child in metaconfiguration.metaconfigurations" :key="child.iri" class="ma-2 pa-1" max-width="200" @keypress.enter="selectMetaconfiguration(child)" @click="selectMetaconfiguration(child)">
                                        <v-img class="white--text align-end" height="100px" contain :src="child.image"></v-img>
                                        <v-card-title class="pb-0 text-break">{{$t_literal(child.title)}}</v-card-title>
                                        <v-card-text class="text--primary">
                                            <div>{{$t_literal(child.description)}}</div>
                                        </v-card-text>
                                    </v-card>
                                </div>

                                <div class="card-list">
                                    <v-card outlined v-for="child in metaconfiguration.configurations" :key="child.iri" @keypress.enter="selectConfiguration(child)" @click="selectConfiguration(child)">
                                        <v-card-title>{{$t_literal(child.title)}}</v-card-title>
                                        <v-card-text>{{$t_literal(child.description)}}</v-card-text>
                                    </v-card>
                                </div>
                                <v-card-actions>
                                    <v-btn color="primary" text @click="customPanel = true">{{ $t("configuration_selection.custom_panel.button") }}</v-btn>
                                    <v-btn color="primary" text @click="LoadFromFile">{{ $t("configuration_selection.open_from_file") }}</v-btn>
                                    <div class="flex-grow-1"></div>
                                    <v-btn color="primary" text @click="dialog = false">{{ $t("configuration_selection.close") }}</v-btn>
                                </v-card-actions>
                            </div>
                        </v-tab-item>

                        <!-- This panel is for custom loading of meta configuration, configuration and for completely
                        custom configuration -->
                        <v-tab-item>
                            <div class="byHand">
                                <h1>{{ $t("configuration_selection.custom_panel.title") }}</h1>
                                <v-alert dismissible v-model="customShowAlert" :type="customPanelErrorSuccessType === 4 ? 'success' : 'error'" v-if="customPanelErrorSuccessType > 0">
                                    {{$t('configuration_selection.custom_panel.messages.' + customPanelErrorSuccessTypeMessage)}}
                                </v-alert>

                                <v-tabs v-model="customPanelTab" class="mb-4">
                                    <v-tab>{{ $t("configuration_selection.custom_panel.meta_configuration.tab") }}</v-tab>
                                    <v-tab>{{ $t("configuration_selection.custom_panel.configuration.tab") }}</v-tab>
                                    <v-tab>{{ $t("configuration_selection.custom_panel.custom_configuration.tab") }}</v-tab>
                                </v-tabs>

                                <v-tabs-items v-model="customPanelTab">
                                    <v-tab-item>
                                        <h2>{{ $t("configuration_selection.custom_panel.meta_configuration.title") }}</h2>
                                        <v-row align="center">
                                            <v-col cols="10">
                                                <v-text-field v-model="customMetaConfiguration" :label="$t('configuration_selection.custom_panel.meta_configuration.input')" @keypress.enter="customLoadMetaConfiguration()" />
                                            </v-col>
                                            <v-col cols="2">
                                                <v-btn outlined block :loading="customMetaConfigurationLoading" @click="customLoadMetaConfiguration()">{{ $t("configuration_selection.load") }}</v-btn>
                                            </v-col>
                                        </v-row>
                                    </v-tab-item>

                                    <v-tab-item>
                                        <h2>{{ $t("configuration_selection.custom_panel.configuration.title") }}</h2>
                                        <v-row align="center">
                                            <v-col cols="10">
                                                <v-text-field v-model="customConfigurationIRI" :label="$t('configuration_selection.custom_panel.configuration.input')" @keypress.enter="customLoadConfiguration"/>
                                            </v-col>
                                            <v-col cols="2">
                                                <v-btn outlined block :loading="customConfigurationLoading" @click="customLoadConfiguration">{{ $t("configuration_selection.load") }}</v-btn>
                                            </v-col>
                                        </v-row>
                                    </v-tab-item>

                                    <v-tab-item>
                                        <h2>{{ $t("configuration_selection.custom_panel.custom_configuration.title") }}</h2>
                                        <v-row align="center">
                                            <v-col cols="10">
                                                <v-text-field v-model="customCustomConfigurationIRI" :label="$t('configuration_selection.custom_panel.custom_configuration.configuration')" @keypress.enter="customCustomConfigurationLoad"/>
                                            </v-col>
                                            <v-col cols="2">
                                                <v-btn outlined block :loading="customCustomConfigurationLoading" @click="customCustomConfigurationLoad">{{ $t("configuration_selection.load") }}</v-btn>
                                            </v-col>
                                        </v-row>
                                        <v-text-field v-model="customCustomConfigurationStylesheet" :label="$t('configuration_selection.custom_panel.custom_configuration.stylesheet')" />
                                        <v-text-field v-model="customCustomConfigurationIriPattern" :label="$t('configuration_selection.custom_panel.custom_configuration.pattern')" />
                                        <v-textarea v-model="customCustomConfigurationAutocomplete" auto-grow rows="1" :label="$t('configuration_selection.custom_panel.custom_configuration.autocomplete')" />
                                        <v-btn outlined block @click="customCustomConfigurationConfirm">{{ $t("configuration_selection.custom_panel.custom_configuration.confirm") }}</v-btn>
                                    </v-tab-item>
                                </v-tabs-items>

                                <v-card-actions>
                                    <div class="flex-grow-1"></div>
                                    <v-btn color="primary" text @click="customPanel = false">{{ $t("configuration_selection.back") }}</v-btn>
                                    <v-btn color="primary" text @click="dialog = false">{{ $t("configuration_selection.close") }}</v-btn>
                                </v-card-actions>
                            </div>
                        </v-tab-item>

                        <!-- This div is visible when user selects a configuration -->
                        <v-tab-item>
                            <div class="nodeSelection" v-if="configuration">
                                <div v-if="$te_literal(configuration.title)">
                                    <h1>{{$t_literal(configuration.title)}}</h1>
                                    <p class="text--disabled">{{$t_literal(configuration.description)}}</p>
                                </div>
                                <div v-else>
                                    <h1>{{ $t("configuration_selection.node_selection.unnamed") }}</h1>
                                    <p class="text--disabled">{{configuration.iri}}</p>
                                </div>

                                <h2>{{ $t("configuration_selection.node_selection.choose_message") }}</h2>

                                <p>{{ $t("configuration_selection.node_selection.choose_info") }}</p>

                                <search-component
                                        :graph-searcher="graphSearcher"
                                        @searched="nodeSelectionSelectNode($event)"
                                        class="mb-4"
                                />

                                <div v-if="configuration.startingNode && configuration.startingNode.length" class="mt-8">
                                    <h3>{{ $t("configuration_selection.node_selection.predefined") }}</h3>
                                    <div class="card-list">
                                        <v-card outlined v-for="node in startingNodesList" :key="node.iri" @keypress.enter="nodeSelectionSelectNode(node.iri)" @click="nodeSelectionSelectNode(node.iri)">
                                            <v-card-title>
                                                <v-progress-circular v-if="node.loading" size="24" class="mr-4" indeterminate color="primary" />
                                                {{node.label}}
                                            </v-card-title>
                                            <v-chip label small v-for="cls in getClassesColors(node.classes)" :key="cls.label" :color="cls.color" style="vertical-align: super;" class="mx-2 class">{{cls.label}}</v-chip>
                                        </v-card>
                                    </div>
                                </div>

                                <div class="text-center" v-if="nodeSelectionLoading">
                                    <v-progress-circular indeterminate color="primary" />
                                    <v-card-text class="px-0 text--disabled">{{ $t("configuration_selection.node_selection.loading") }}</v-card-text>
                                </div>

                                <v-alert dismissible v-if="nodeSelectionError" type="error">
                                    {{$t('configuration_chooser.node_selection.fetch_error')}}
                                </v-alert>

                                <v-card-actions>
                                    <div class="flex-grow-1"></div>
                                    <v-btn color="primary" text @click="configuration = null">{{ $t("configuration_selection.back") }}</v-btn>
                                    <v-btn color="primary" text @click="dialog = false">{{ $t("configuration_selection.go_to_graph") }}</v-btn>
                                </v-card-actions>
                            </div>
                        </v-tab-item>
                    </v-tabs-items>

                    <div class="footer">
                        <v-select :items="languages" solo v-model="$i18n.locale" class="language" />
                    </div>
                </v-card>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
    import {Component, Emit, Mixins, Prop, Watch} from "vue-property-decorator";
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
    import NodeCommonPanelMixin from "./side-panel/NodeCommonPanelMixin";

    export enum ConfigurationChooserComponentModes {
        NEW_GRAPH,
        CHANGE_CONFIGURATION
    }

@Component({
    components: {SearchComponent}
})
export default class ConfigurationChooserComponent extends Mixins(NodeCommonPanelMixin) {
    @Prop() defaultMetaconfiguration !: Metaconfiguration;
    @Prop() configurationManager !: ConfigurationManager;
    @Prop() remoteServer !: RemoteServer;
    @Prop() graph !: Graph;
    @Prop() graphManipulator !: GraphManipulator;
    @Prop() graphSearcher !: GraphSearcher;
    @Prop() mode !: ConfigurationChooserComponentModes;

    // If this dialog is opened
    private dialog: boolean = false;

    // Selected metaconfiguration
    private metaconfiguration: Metaconfiguration = null;

    // Selected configuration, if not null, panels are switched
    private configuration: Configuration = null;

    // If the custom panel is opened
    private customPanel: boolean = false;

    // Breadcrumbs of metaconfigurations (navigation in history)
    private breadcrumbs: Metaconfiguration[] = [];

    // Which tab is opened in custom panel section
    private customPanelTab: number = 0;

    /**
     * Helper method to get list of languages for language selector.
     * Todo: create component of it
     * */
    private get languages() {
        let result = [];
        for (let language in this.$i18n.messages) {
            result.push({
                text: this.$i18n.messages[language]['_lang_local'],
                value: language,
            });
        }
        return result;
    }

    /**
     * Returns a list of starting nodes for third panel (node selection).
     * */
    private get startingNodesList() {
        let list = [];
        if (this.configuration) {
            for (let iri of this.configuration.startingNode) {
                let label = this.graph.nodes[iri]?.currentView?.preview?.label;
                let classes = this.graph.nodes[iri]?.currentView?.preview?.classes ?? [];
                list.push({
                    loading: !label,
                    label: label ?? iri,
                    classes,
                    iri,
                });
            }
        }
        return list;
    }

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
     * Emits request to load data from file
     * */
    @Emit()
    private LoadFromFile() {
        this.close();
    }

    private get currentPanelOpen(): number {
        if (this.customPanel) return 1;
        if (this.configuration) return 2;
        return 0;
    }

    /**
     * When the language is changed, send request to load those languages.
     * */
    @Watch('$i18n.locale')
    private languageChanged() {
        this.metaconfiguration?.sync(this.$i18nGetAllLanguages());
        this.configuration?.sync(this.$i18nGetAllLanguages());
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

    /**
     * Sets new meta configuration and inserts it into the breadcrumbs (history).
     * */
    private selectMetaconfiguration(metaconfiguration: Metaconfiguration) {
        this.breadcrumbs.push(this.metaconfiguration);
        this.metaconfiguration = metaconfiguration;
        this.metaconfiguration.sync(this.$i18nGetAllLanguages());
    }

    /**
     * Method is called by UI elements when user selects specific configuration.
     * */
    private selectConfiguration(configuration: Configuration) {
        if (this.mode == ConfigurationChooserComponentModes.NEW_GRAPH) {
            this.configuration = configuration;

            if (this.configuration) {
                this.ConfigurationUpdate(this.configuration, true);
                this.nodeSelectionLoading = false;
                this.nodeSelectionError = false;
            }
        }

        if (this.mode == ConfigurationChooserComponentModes.CHANGE_CONFIGURATION) {
            this.ConfigurationUpdate(configuration, false);
            this.close();
        }
    }

    /**
     * Returns in breadcrumbs.
     * */
    private returnInHistory(toIndex: number) {
        if (toIndex == -1) {
            this.metaconfiguration = this.defaultMetaconfiguration;
            this.breadcrumbs = [];
        } else {
            this.metaconfiguration = this.breadcrumbs[toIndex];
            this.breadcrumbs = this.breadcrumbs.slice(0, toIndex);
        }
    }

    //#region Custom panel
    @Watch('customPanel')
    private customPanelChanged() {
        this.customShowAlert = false;
    }
    //#endregion Custom panel

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
        let ok = await metaConfiguration.sync(this.$i18nGetAllLanguages());

        this.customShowAlert = !ok;
        this.customPanelErrorSuccessType = 1;

        this.customMetaConfigurationLoading = false;

        if (ok) {
            this.customPanel = false;
            this.selectMetaconfiguration(metaConfiguration);
            this.customMetaConfiguration = "";
        }
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
        let ok = await configuration.sync(this.$i18nGetAllLanguages());

        this.customShowAlert = !ok;
        this.customPanelErrorSuccessType = 2;

        this.customConfigurationLoading = false;

        if (ok) {
            this.customPanel = false;
            this.customConfigurationIRI = "";
            this.selectConfiguration(configuration);
        }
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
        let ok = await conf.sync(this.$i18nGetAllLanguages());
        this.customCustomConfigurationLoading = false;
        this.customShowAlert = true;
        this.customPanelErrorSuccessType = ok ? 4 : 3;

        if (ok) {
            this.customCustomConfigurationStylesheet = conf.stylesheet.length ? conf.stylesheet[0] : null;
            this.customCustomConfigurationIriPattern = conf.resourcePattern;
            this.customCustomConfigurationAutocomplete = conf.autocomplete.join('\n');
        }
    }

    private customCustomConfigurationConfirm() {
        let configuration = new Configuration(this.customCustomConfigurationIRI, null);
        configuration.autocomplete = this.customCustomConfigurationAutocomplete.split('\n');
        configuration.stylesheet = [this.customCustomConfigurationStylesheet];
        configuration.resourcePattern = this.customCustomConfigurationIriPattern;

        this.selectConfiguration(configuration);
        this.customPanel = false;
    }

    //#endregion Custom panel / custom configuration

    //#region Node selection panel
    @Watch('graph')
    @Watch('configuration.startingNode')
    private fetchNodes() {
        if (this.configuration && this.graph) {
            for (let iri of this.configuration.startingNode) {
                this.graph.getOrCreateNode(iri);
            }
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
        }

        this.nodeSelectionLoading = true;
    }

    //#endregion Node selection panel

    //#region Dialog show close methods
    /**
     * Shows the dialog.
     * It is expected that all changes were saved and therefore the graph can be replaced
     * */
    public show(metaConfigurationIri: string = undefined) {
        if (!this.metaconfiguration) {
            this.metaconfiguration = this.defaultMetaconfiguration;
        }
        if (metaConfigurationIri) {
            this.selectMetaconfiguration(this.configurationManager.getOrCreateMetaconfiguration(metaConfigurationIri));
        }
        this.metaconfiguration.sync(this.$i18nGetAllLanguages());
        this.configuration = null;
        this.customPanel = false;
        this.dialog = true;
    }

    public async showConfiguration(configurationIri: string) {
        let configuration = this.configurationManager.getOrCreateConfiguration(configurationIri);
        await configuration.sync(this.$i18nGetAllLanguages());
        this.show();
        this.configuration = configuration;
    }

    public close() {
        this.dialog = false;
    }

    //#endregion Dialog show close methods

}
</script>

<style scoped  lang="scss">
    .container > div, .footer {
        max-width: 60em;
        margin: 1em auto;
        padding-left: 1em;
        padding-right: 1em;
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

    .footer {
        margin-top: 2em !important;
        border-top: 1px solid lightgray;
        padding-top: 1em;

        .language {
            width: 8cm;
            margin: 0 0 0 auto !important;
        }
    }

    .class {
        vertical-align: middle !important;
    }
</style>
