<template>
    <v-app class="app">
        <v-content class="d-flex flex-grow-1" style="overflow: hidden;">
            <graph-area
                    :graph="graph"
                    :data-source="dataSource"
                    :stylesheet="stylesheet"
                    :left-offset="leftOffset"
                    :right-offset="rightOffset"
                    :view-options="viewOptions"
                    :graph-searcher="graphSearcher"
                    :manipulator="manipulator"
                    :area-manipulator="areaManipulator"
                    @new-manipulator="areaManipulatorUpdated($event)"
            />
            <side-panel :graph="graph" :area-manipulator="areaManipulator" :hidden-panel.sync="hiddenPanel" ref="sidePanel" @width-changed="rightOffset = $event"/>

            <v-navigation-drawer expand-on-hover absolute dark permanent stateless ref="bar" @update:mini-variant="$refs.languageMenu.isActive = false">
                <v-list dense nav class="py-0">
                    <v-list-item two-line style="padding-left: 0;">
                        <v-list-item-avatar>
                            KG<br>VB
                        </v-list-item-avatar>

                        <v-list-item-content>
                            <v-list-item-title>KGVisualBrowser</v-list-item-title>
                            <v-list-item-subtitle>By Štěpán Stenchlák</v-list-item-subtitle>
                        </v-list-item-content>
                    </v-list-item>

                    <v-divider></v-divider>

                    <v-list-item link @click="$refs.addNode.show()"><v-list-item-icon><v-icon>{{ icons.add }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.add_nodes") }}</v-list-item-title></v-list-item-content></v-list-item>
                    <v-list-item link @click="$refs.filterDialog.show()"><v-list-item-icon><v-badge overlap :value="filter.active" :content="filter.active"><v-icon>{{ icons.filter }}</v-icon></v-badge></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.filter") }}</v-list-item-title></v-list-item-content></v-list-item>
                    <v-list-item link @click="$refs.viewOptionsDialog.show()"><v-list-item-icon><v-badge dot :value="viewOptions.active"><v-icon>{{ icons.viewOptions }}</v-icon></v-badge></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.view_options") }}</v-list-item-title></v-list-item-content></v-list-item>
                    <v-list-item link @click="hiddenPanel = !hiddenPanel"><v-list-item-icon><v-badge dot :value="hiddenPanel"><v-icon>{{ icons.hidden }}</v-icon></v-badge></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.hidden_nodes") }}</v-list-item-title></v-list-item-content></v-list-item>
                    <v-list-item link @click="layoutDialog.show()"><v-list-item-icon><v-icon>{{ icons.layout }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.layout") }}</v-list-item-title></v-list-item-content></v-list-item>

                    <v-divider></v-divider>

                    <v-list-item link @click="doLoadFromFileProcess()" ><v-list-item-icon><v-icon>{{ icons.load }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.load") }}</v-list-item-title></v-list-item-content></v-list-item>
                    <v-list-item link @click="saveToFile()"><v-list-item-icon><v-icon>{{ icons.save }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.save") }}</v-list-item-title></v-list-item-content></v-list-item>
                    <v-list-item link @click="$refs.configurationStylesheetDialog.show()"><v-list-item-icon><v-icon>{{ icons.configuration }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.configuration") }}</v-list-item-title></v-list-item-content></v-list-item>

                    <v-divider></v-divider>

                    <v-list-group :prepend-icon="icons.language" :color="null" ref="languageMenu">
                        <template v-slot:activator>
                            <v-list-item-title>{{ $t("menu.language") }}</v-list-item-title>
                        </template>

                        <v-list>
                            <v-list-item v-for="(messages, code) in this.$root.$i18n.messages" :key="code" @click="menuLanguageSelected(code)">
                                <v-list-item-title>{{ messages['_lang_local'] }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-list-group>

                    <v-list-item link @click="$refs.settingsDialog.show()"><v-list-item-icon><v-icon>{{ icons.settings }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.settings") }}</v-list-item-title></v-list-item-content></v-list-item>
                </v-list>
            </v-navigation-drawer>
        </v-content>

        <v-footer v-if="false" dark padless>
            <v-card class="flex" flat tile>
                <v-card-text class="py-2 white--text">
                    <v-progress-circular color="white" indeterminate size="16" width="2" class="mr-1"></v-progress-circular> <strong>Fetching resources...</strong> [5 left]
                </v-card-text>
            </v-card>
        </v-footer>

        <add-node ref="addNode" :graph="graph" :manipulator="manipulator" :graph-searcher="graphSearcher"/>
        <filter-dialog ref="filterDialog" :graph="graph" :filter="filter" />
        <save-dialog ref="saveDialog" />
        <configuration-stylesheet-dialog
                ref="configurationStylesheetDialog"
                :oldConfiguration="dataSource ? dataSource.configuration : null"
                :oldStylesheet="dataSource ? dataSource.stylesheet : null"

                :hasUnsavedChanges="hasUnsavedChanges"
                :saveDialog="saveDialog"
                :saveFunction="saveToFile"
                @changed="configurationStylesheetUpdated"
                @requestLoadFromFile="doLoadFromFileProcess"
        />
        <vue-filter-component-creator :graph="graph" :filter="filter" />
        <view-options-dialog :options="viewOptions" ref="viewOptionsDialog"></view-options-dialog>
        <settings-dialog
                :remote-url.sync="remoteURL"
                ref="settingsDialog"
        ></settings-dialog>
        <settings
                :remote-url.sync="remoteURL"
        ></settings>
        <load-dialog ref="loadDialog" @selected="loadFromFile($event)"></load-dialog>
        <layout-dialog ref="layoutDialog" :layouts="layouts" />
    </v-app>
</template>

<script lang="ts">
    import GraphArea from './graph/GraphArea.vue';
    import AddNode from './AddNode.vue';
    import ConfigurationStylesheetDialog from './ConfigurationStylesheetDialog.vue';
    import { DataGraphFetcher } from '../graph-fetcher/DataGraphFetcher';
    import { Graph } from '../graph/Graph';
    import SidePanel from './side-panel/SidePanel.vue';
    import SaveDialog from './SaveDialog.vue';
    import FilterDialog from './filter/FilterDialog.vue';
    import VueFilterComponentCreator from '../filter/VueFilterComponentCreator';
    import PropertyFilterComponent from '../filter/filters/PropertyFilter/PropertyFilterComponent';
    import PropertyFilterData from "../filter/filters/PropertyFilter/PropertyFilterData";
    import DegreeFilterComponent from "../filter/filters/DegreeFilter/DegreeFilterComponent";
    import DegreeFilterData from "../filter/filters/DegreeFilter/DegreeFilterData";
    import Component from "vue-class-component";
    import {LocaleMessage} from "vue-i18n";
    import {Mixins, Ref, Watch} from "vue-property-decorator";
    import {ResponseStylesheet} from "../graph-fetcher/response-interfaces";
    import {DataSource} from "../DataSource";

    import {
        mdiPlusThick,
        mdiFileUploadOutline,
        mdiFileDownloadOutline,
        mdiTranslate,
        mdiEthernetCable,
        mdiFilterOutline,
        mdiCogs,
        mdiEye,
        mdiImageFilterTiltShift,
        mdiLayersTriple
    } from '@mdi/js';
    import {VListGroup} from "vuetify/lib";
    import SettingsDialog from "./SettingsDialog.vue";
    import Settings from "./Settings";
    import ViewOptionsDialog from "./ViewOptionsDialog.vue";
    import ViewOptions from "../graph/ViewOptions";
    import {FiltersList} from "../filter/Filter";
    import GraphAreaManipulator from "../graph/GraphAreaManipulator";
    import GraphManipulator from "../graph/GraphManipulator";
    import LoadDialog from "./LoadDialog.vue";
    import ApplicationLoadStoreMixin from "./ApplicationLoadStoreMixin";
    import GraphSearcher from "../GraphSearcher";
    import Searcher from "../searchers/Searcher";
    import LocalGraphSearcher from "../searchers/LocalGraphSearcher";
    import SimpleJsonSearcher from "../searchers/SimpleJsonSearcher";
    import IRIConstructorSearcher from "../searchers/IRIConstructorSearcher";
    import IRIIdentitySearcher from "../searchers/IRIIdentitySearcher";
    import LayoutDialog from "./LayoutDialog.vue";
    import {LayoutManager} from "../layouts/LayoutManager";
    import ColaLayoutSettingsComponent from "../layouts/cola/ColaLayoutSettingsComponent.vue";
    import ColaLayout from "../layouts/cola/ColaLayout";
    let Configuration: {api: string} = require("../../conf.yaml");

    @Component({
        components: {
            LayoutDialog,
            LoadDialog,
            ViewOptionsDialog,
            Settings,
            SettingsDialog,
            VueFilterComponentCreator,
            GraphArea,
            AddNode,
            SidePanel,
            ConfigurationStylesheetDialog,
            SaveDialog,
            FilterDialog,
        }
    })
    export default class Application extends Mixins(ApplicationLoadStoreMixin) {
        /**
         * Contains all nodes, edges and their information.
         * */
        graph: Graph = new Graph();

        /**
         * Helper class for graph are manipulation such as animations, etc.
         *
         * It is created by GraphArea component.
         *
         * @non-reactive Must not be set until Vue inits its reactivity (even null is forbidden)
         * */
        areaManipulator !: GraphAreaManipulator;

        /**
         * Helper class for graph manipulation such as adding multiple nodes, etc.
         *
         * @non-reactive Must not be set until Vue inits its reactivity (even null is forbidden)
         * */
        manipulator !: GraphManipulator;

        /**
         * Simple object containing data how graph should be rendered.
         * Example: Show dots instead of labeled nodes without edges.
         * */
        viewOptions = new ViewOptions();

        /**
         * List of node filters supported in the application.
         * Theoretically, the filter list can be dynamically expanded.
         *
         * filter - object containing filter data (like max, min, whether is active]
         * component - a Vue component linked to filter field and every node (so programmer can define watchers and
         * decide whether the node should be visible or not)
         *
         * Despite the array here, the FilterDialog component ignores it and shows only those filters which are
         * programmed in the FilterDialog component. Todo add field with Vue component which renders filter settings
         * so the FilterDialog will not depend on specific filters and can be dynamically changed.
         *
         * It is similar to LayoutsList.
         * */
        filter = new FiltersList([
            {
                name: "degreeFilter",
                component: DegreeFilterComponent,
                filter: new DegreeFilterData(),
            },
            {
                name: "propertyFilter",
                component: PropertyFilterComponent,
                filter: new PropertyFilterData()
            }
        ]);

        /**
         * List of layouts supported in the application.
         * This list can be dynamically expanded by plugins.
         *
         * Items are constant, that means, that instance of every layout is created only once and remains same even
         * if the whole graph is changed.
         *
         * name - name of the layout used for saving to file
         * settingsComponent - Vue component rendering settings page to the layout
         * layout - the core instance containing parameters and layout algorithms
         *
         * It is similar to FiltersList.
         * */
        layouts = new LayoutManager([
            {
                name: 'cola',
                settingsComponent: ColaLayoutSettingsComponent,
                layout: new ColaLayout(),
            },
        ]);

        /**
         * URL where remote API is located.
         * It is not a constant and can be changed anytime.
         * It is a part of settings and can be overridden by local storage.
         * */
        remoteURL: string = Configuration.api;

        /**
         * Current stylesheet for Cytoscape object.
         *
         * The stylesheet can be fetched from dataSource.stylesheet IRI or form saved graph from file.
         * */
        stylesheet: ResponseStylesheet = { styles: [] };

        /**
         * Data source contains information about configuration IRI, stylesheet IRI, starting node and others.
         * Both the whole object and single fields can be changed.
         * */
        dataSource: DataSource = null;

        @Ref() readonly addNode !: AddNode;
        @Ref() readonly filterDialog !: FilterDialog;
        @Ref() readonly saveDialog !: SaveDialog;
        @Ref() readonly configurationStylesheetDialog !: ConfigurationStylesheetDialog;
        @Ref() readonly bar !: any;
        @Ref() readonly languageMenu !: typeof VListGroup;
        @Ref() readonly settingsDialog !: typeof SettingsDialog;
        @Ref() readonly loadDialog !: LoadDialog;
        @Ref() readonly layoutDialog !: typeof LayoutDialog;

        private rightOffset: number = 0;
        private leftOffset: number = 56; // Collapsed width of Vuetify v-navigation-drawer
        private languageMenuActive: boolean = false; // Whether the item "Language" is opened with all the available languages

        /**
         * If is opened the panel with hidden nodes
         * */
        hiddenPanel: boolean = false;

        // When user clicks on specific language in the left panel
        private menuLanguageSelected(languageCode: string) {
            this.$root.$i18n.locale = languageCode;
            // @ts-ignore types
            this.languageMenu.isActive = false;
        }

        // List of available languages to main menu
        translations: {text: LocaleMessage, value: string}[] = [];

        // List of icons used in main menu
        icons = {
            add: mdiPlusThick,
            filter: mdiFilterOutline,
            viewOptions: mdiEye,
            hidden: mdiImageFilterTiltShift,
            layout: mdiLayersTriple,

            load: mdiFileUploadOutline,
            save: mdiFileDownloadOutline,

            configuration: mdiEthernetCable,

            language: mdiTranslate,
            settings: mdiCogs,
        };

        /**
         * Function to create a new graph (and discard old one).
         */
        createGraph() {
            this.graph = new Graph();
            this.updateFetcher();
            this.updateStylesheet();
        }

        /**
         * Function to update graph fetcher.
         *
         * Is automatically called when remote URL is changed
         */
        @Watch('remoteURL')
        updateFetcher() {
            this.graph.fetcher = new DataGraphFetcher(this.remoteURL, this.dataSource?.configuration);
        }

        async updateStylesheet() {
            try {
                this.stylesheet = await this.graph.fetcher.getStylesheet(this.dataSource.stylesheet);
            } catch (e) {
                console.warn("Error occurred while fetching the stylesheet.\nCheck the correctness of the IRI, configuration IRI, URL of remote server or the internet connection.\nStyles will be emptied.");
                this.stylesheet.styles = [];
            }
        }

        /**
         * When graph is changed, change it also in all dependent classes.
         * Todo still in work. #DependencyInjection
         * */
        @Watch('graph', {immediate: true})
        private graphChanged(graph: Graph) {
            if (this.areaManipulator) this.areaManipulator.graph = graph;
        }

        /**
         * Called by GraphArea component when cytoscape instance is mounted.
         * */
        private areaManipulatorUpdated(manipulator: GraphAreaManipulator) {
            this.areaManipulator = manipulator;
            this.areaManipulator.graph = this.graph;

            this.layouts.graphAreaManipulatorChanged(this.areaManipulator);
            this.areaManipulator.layoutManager = this.layouts;

            this.createNewManipulator()
        }

        @Watch('graph')
        private createNewManipulator() {
            if (this.graph && this.areaManipulator) {
                this.manipulator = new GraphManipulator(this.graph, this.areaManipulator, this.layouts);
            }
        }

        /**
         * Vue method called when component is created
         */
        created() {
            // Resolve languages
            for (let code in this.$root.$i18n.messages) {
                this.translations.push({
                    text: this.$root.$i18n.messages[code]['_lang_local'],
                    value: code
                });
            }

            // Create @non-reactive properties
            this.areaManipulator = null;
            this.manipulator = null;

            // @ts-ignore backdoor to api
            window['kgvb'] = this;
        }

        /**
         * Vue method called when everything is mounted
         */
        mounted() {
            this.configurationStylesheetDialog.show();

            // Add watcher after the components are mounted
            this.$watch(
                () => {return this.bar.computedWidth},
                (val) => {this.leftOffset = val;}
            );
        }

        configurationStylesheetUpdated(update: { configuration: string, stylesheet: string, resource: string } | DataSource) {
            let fullUpdate = update.configuration !== this.dataSource?.configuration;
            let stylesheetUpdated = update.stylesheet !== this.dataSource?.stylesheet;
            this.dataSource = update;

            if (fullUpdate) {
                this.createGraph();
                this.filter.reset();
            }
            if (!fullUpdate && stylesheetUpdated) this.updateStylesheet();

            if (fullUpdate) this.addNode.show(update.resource ?? null);
        }

        /**
         * GraphSearcher can search nodes in current graph, in remote server or construct IRI from ID.
         */
        graphSearcher: GraphSearcher = null;

        /**
         * Method for updating graphSearcher. It depends on graph instance and data source.
         */
        @Watch('graph')
        @Watch('dataSource')
        private updateGraphSearcher() {
            if (this.graph) {
                let searchers: Searcher[] = [];

                searchers.push(new LocalGraphSearcher(this.graph));
                if (this.dataSource.autocomplete) searchers.push(new SimpleJsonSearcher(this.dataSource.autocomplete));
                if (this.dataSource.iri_by_id) searchers.push(new IRIConstructorSearcher(this.dataSource.iri_by_id.template, new RegExp(this.dataSource.iri_by_id.id_structure)));
                searchers.push(new IRIIdentitySearcher(this.dataSource.iri_structure ? new RegExp(this.dataSource.iri_structure) : null));

                this.graphSearcher = new GraphSearcher(searchers);
            }
        }

        //#region Functions that watch graph and trigger layout event handlers

        // All we need is to know that at least one lockedForLayouts has changed.
        // I was afraid that watching every single node can halt layout when batch change therefore we first count
        // some number from it and watch the number
        private get countNodesLockedForLayout(): number {
            let count: number = 0;
            for (let IRI in this.graph.nodes) {
                if (this.graph.nodes[IRI].lockedForLayouts) {
                    count++;
                }
            }
            return count;
        }

        @Watch('countNodesLockedForLayout')
        private countNodesLockedForLayoutChanged() {
            this.layouts?.currentLayout?.onLockedChanged();
        }
        //#endregion Functions that watch graph and trigger layout event handlers
    }
</script>
<style>
    html {
        overflow: hidden !important;
    }

    .app {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }

    .v-content__wrap {
        display: flex;
    }

    .toolbar {
        z-index: 10;
    }
</style>
