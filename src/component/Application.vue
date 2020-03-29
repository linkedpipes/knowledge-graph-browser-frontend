<template>
    <v-app class="app">
        <v-toolbar class="toolbar" style="flex: none;">
            <v-toolbar-items>
                <v-btn @click="$refs.addNode.show()" text>{{ $t("new_nodes.button") }}</v-btn>
                <v-btn text>{{ $t("load_dialog.button") }}</v-btn>
                <v-btn @click="$refs.saveDialog.show()" text>{{ $t("save_dialog.button") }}</v-btn>
            </v-toolbar-items>

            <div class="flex-grow-1"></div>

            <v-toolbar-items>
                <v-menu offset-y>
                    <template v-slot:activator="{ on }">
                        <v-btn text v-on="on">{{ $t("_lang_local") }}</v-btn>
                    </template>
                    <v-list>
                        <v-list-item v-for="(messages, code) in this.$root.$i18n.messages" :key="code" @click="$root.$i18n.locale = code">
                            <v-list-item-title>{{ messages['_lang_local'] }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
                <v-btn @click="$refs.configurationStylesheetDialog.show()" text>{{ $t("change_configuration_and_stylesheet") }}</v-btn>
            </v-toolbar-items>

            <template #extension>
                <!--                <span class="mr-2" v-if="!filter_active">No vertices were filtered out.</span>
                                <span class="mr-2" v-if="filter_active">Filtered by:</span>
                                <span class="filter-list" v-if="filter_active">
                                    <v-chip close><b>Degree</b>&nbsp;at least 5</v-chip>
                                    <v-chip close color="secondary" class="pa-5"> <v-chip close><b>Degree</b>&nbsp;at least 5</v-chip> OR <v-chip close><b>Degree</b>&nbsp;at least 5</v-chip></v-chip>
                                </span>-->
                <v-toolbar-items>
                    <v-btn @click="$refs.filterDialog.show()" text>Add a new filter</v-btn>
                </v-toolbar-items>
            </template>
        </v-toolbar>
        <v-content class="d-flex flex-grow-1" style="overflow: hidden; background: greenů">

            <v-navigation-drawer
                    color="red"
                    expand-on-hover
                    absolute
                    dark
            >
                <v-list
                        dense
                        nav
                        class="py-0"
                >
                    <v-list-item two-line>
                        <v-list-item-avatar>
                            <img src="https://randomuser.me/api/portraits/men/81.jpg">
                        </v-list-item-avatar>

                        <v-list-item-content>
                            <v-list-item-title>Application</v-list-item-title>
                            <v-list-item-subtitle>Subtext</v-list-item-subtitle>
                        </v-list-item-content>
                    </v-list-item>

                    <v-divider></v-divider>

                    <v-list-item
                            v-for="item in items"
                            :key="item.title"
                            link
                    >
                        <v-list-item-icon>
                            <v-icon>{{ item.icon }}</v-icon>
                        </v-list-item-icon>

                        <v-list-item-content>
                            <v-list-item-title>{{ item.title }}</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </v-navigation-drawer>


            <graph-area :graph="graph" :stylesheet="stylesheet"/>
            <side-panel :graph="graph"/>
        </v-content>

        <add-node ref="addNode" :graph="graph" />
        <filter-dialog ref="filterDialog" :graph="graph" :filter="filter" />
        <save-dialog ref="saveDialog" />
        <configuration-stylesheet-dialog
                ref="configurationStylesheetDialog"
                :oldConfiguration="configurationIRI"
                :oldStylesheet="stylesheetIRI"
                @changed="configurationStylesheetUpdated"
        />
        <vue-filter-component-creator :graph="graph" :filter="filter" />
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
    import Filter from '../filter/Filter';
    import PropertyFilterComponent from '../filter/filters/PropertyFilter/PropertyFilterComponent';
    import PropertyFilterData from "../filter/filters/PropertyFilter/PropertyFilterData";
    import DegreeFilterComponent from "../filter/filters/DegreeFilter/DegreeFilterComponent";
    import DegreeFilterData from "../filter/filters/DegreeFilter/DegreeFilterData";
    import Component from "vue-class-component";
    import {LocaleMessage} from "vue-i18n";
    import Vue from 'vue';
    import {Ref, Watch} from "vue-property-decorator";
    import {ResponseStylesheet} from "../graph-fetcher/response-interfaces";

    @Component({
        components: {
            VueFilterComponentCreator,
            GraphArea,
            AddNode,
            SidePanel,
            ConfigurationStylesheetDialog,
            SaveDialog,
            FilterDialog,
        }
    })
    export default class Application extends Vue {
        graph: Graph = new Graph(null);

        @Ref() readonly addNode !: AddNode;
        @Ref() readonly filterDialog !: FilterDialog;
        @Ref() readonly saveDialog !: SaveDialog;
        @Ref() readonly configurationStylesheetDialog : ConfigurationStylesheetDialog;

        filter: Filter[] = [
            {
                name: "degreeFilter",
                component: DegreeFilterComponent,
                data: new DegreeFilterData(),
            },
            {
                name: "propertyFilter",
                component: PropertyFilterComponent,
                data: new PropertyFilterData()
            }
        ];

        translations: {text: LocaleMessage, value: string}[] = [];

        remoteURL: string = "http://wsl.local:3000/";
        configurationIRI: string = null;
        stylesheetIRI: string = null;
        stylesheet: ResponseStylesheet = {
            styles: []
        };

        items = [
            { title: 'Add node', icon: 'mdi-view-dashboard' },
            { title: 'Load', icon: 'mdi-view-dashboard' },
            { title: 'Save', icon: 'mdi-view-dashboard' },
            { title: 'Change configuration', icon: 'mdi-view-dashboard' },
            { title: 'Filter', icon: 'mdi-view-dashboard' },
            { title: 'Language', icon: 'mdi-image' },
            { title: 'About', icon: 'mdi-help-box' },
        ];

        @Watch('configurationIRI')
        createGraph() {
            let fetcher = new DataGraphFetcher(this.remoteURL, this.configurationIRI);
            this.graph = new Graph(fetcher);
        }

        @Watch('stylesheetIRI')
        async stylesheetUpdate() {
            this.stylesheet = await this.graph.fetcher.getStylesheet(this.stylesheetIRI);
        }

        /**
         * Vue method called when component is created
         */
        created() {
/*            let fetcher = new DataGraphFetcher("http://wsl.local:3000/", "https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/psp");
            this.graph = new Graph(fetcher);

            this.graph.createNode("https://psp.opendata.cz/zdroj/osoba/5914").useDefaultView().then((view) => view.fetchPreview());
            this.graph.createNode("https://psp.opendata.cz/zdroj/osoba/5915").useDefaultView().then((view) => view.fetchPreview());*/

            for (let code in this.$root.$i18n.messages) {
                this.translations.push({
                    text: this.$root.$i18n.messages[code]['_lang_local'],
                    value: code
                });
            }
        }

        /**
         * Vue method called when everything is mounted
         */
        mounted() {
            this.configurationStylesheetDialog.show();
        }

        configurationStylesheetUpdated(update: { configuration: string, stylesheet: string, predefinedStartedNodeIRI: string }) {
            this.configurationIRI = update.configuration;
            this.stylesheetIRI = update.stylesheet;

            this.addNode.show(update.predefinedStartedNodeIRI);
        }
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
