<template>
    <v-app class="app">
        <v-toolbar color="secondary" v-if="false" class="toolbar" style="flex: none;">
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
        <v-content class="d-flex flex-grow-1" style="overflow: hidden;">
            <graph-area :graph="graph" :stylesheet="stylesheet" :left-offset="leftOffset" :right-offset="rightOffset"/>
            <side-panel :graph="graph" ref="sidePanel" @width-changed="rightOffset = $event"/>

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
                    <v-list-item link @click="$refs.filterDialog.show()"><v-list-item-icon><v-icon>{{ icons.filter }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.filter") }}</v-list-item-title></v-list-item-content></v-list-item>

                    <v-divider></v-divider>

                    <v-list-item link><v-list-item-icon><v-icon>{{ icons.load }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.load") }}</v-list-item-title></v-list-item-content></v-list-item>
                    <v-list-item link @click="$refs.saveDialog.show()"><v-list-item-icon><v-icon>{{ icons.save }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("menu.save") }}</v-list-item-title></v-list-item-content></v-list-item>
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


                    <!--                    <v-menu offset-y>
                                            <template v-slot:activator="{ on }">
                                                <v-list-item v-on="on" link><v-list-item-icon><v-icon>{{ icons.language }}</v-icon></v-list-item-icon><v-list-item-content><v-list-item-title>{{ $t("_lang_local") }}</v-list-item-title></v-list-item-content></v-list-item>
                                            </template>
                                            <v-list>
                                                <v-list-item v-for="(messages, code) in this.$root.$i18n.messages" :key="code" @click="$root.$i18n.locale = code">
                                                    <v-list-item-title>{{ messages['_lang_local'] }}</v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>-->
                </v-list>
            </v-navigation-drawer>
        </v-content>

        <v-footer
                dark
                padless
        >
            <v-card
                    class="flex"
                    flat
                    tile
            >
                <v-card-text class="py-2 white--text">
                    <v-progress-circular color="white" indeterminate size="16" width="2" class="mr-1"></v-progress-circular> <strong>Fetching resources...</strong> [5 left]
                </v-card-text>
            </v-card>
        </v-footer>

        <add-node ref="addNode" :graph="graph" />
        <filter-dialog ref="filterDialog" :graph="graph" :filter="filter" />
        <save-dialog ref="saveDialog" />
        <configuration-stylesheet-dialog
                ref="configurationStylesheetDialog"
                :oldConfiguration="dataSource ? dataSource.configuration : null"
                :oldStylesheet="dataSource ? dataSource.stylesheet : null"
                @changed="configurationStylesheetUpdated"
        />
        <vue-filter-component-creator :graph="graph" :filter="filter" />
        <settings-dialog
                :remote-url.sync="remoteURL"
                ref="settingsDialog"
        ></settings-dialog>
        <settings
                :remote-url.sync="remoteURL"
        ></settings>
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
    import {DataSource} from "../DataSource";

    import {
        mdiPlusThick,
        mdiFileUploadOutline,
        mdiFileDownloadOutline,
        mdiTranslate,
        mdiEthernetCable,
        mdiFilterOutline,
        mdiCogs
    } from '@mdi/js';
    import {VListGroup} from "vuetify/lib";
    import SettingsDialog from "./SettingsDialog.vue";
    import Settings from "./Settings";

    @Component({
        components: {
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
    export default class Application extends Vue {
        graph: Graph = new Graph(null, null);

        @Ref() readonly addNode !: AddNode;
        @Ref() readonly filterDialog !: FilterDialog;
        @Ref() readonly saveDialog !: SaveDialog;
        @Ref() readonly configurationStylesheetDialog : ConfigurationStylesheetDialog;
        @Ref() readonly bar !: any;
        @Ref() readonly languageMenu !: typeof VListGroup;
        @Ref() readonly settingsDialog !: typeof SettingsDialog;

        rightOffset: number = 0;
        private leftOffset: number = 56; // Collapsed width of Vuetify v-navigation-drawer

        // Whether the item "Language" is opened with all the available languages
        languageMenuActive: boolean = false;

        private menuLanguageSelected(languageCode: string) {
            this.$root.$i18n.locale = languageCode;
            // @ts-ignore types
            this.languageMenu.isActive = false;
        }

        icons = {
            add: mdiPlusThick,
            load: mdiFileUploadOutline,
            save: mdiFileDownloadOutline,
            language: mdiTranslate,
            configuration: mdiEthernetCable,
            filter: mdiFilterOutline,
            settings: mdiCogs,
        };

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

        //remoteURL: string = "http://wsl.local:3000/";
        remoteURL: string = "http://localhost:3000/";
/*        configurationIRI: string = null;
        stylesheetIRI: string = null;*/
        stylesheet: ResponseStylesheet = {
            styles: []
        };
        private dataSource: DataSource = null;


        @Watch('dataSource.configuration')
        createGraph() {
            let fetcher = new DataGraphFetcher(this.remoteURL, this.dataSource.configuration);
            this.graph = new Graph(fetcher, this.dataSource);
        }

        @Watch('dataSource.stylesheet')
        async stylesheetUpdate() {
            this.stylesheet = await this.graph.fetcher.getStylesheet(this.dataSource.stylesheet);
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

            // Add watcher after the components are mounted
            this.$watch(
                () => {return this.bar.computedWidth},
                (val) => {this.leftOffset = val;}
            );
        }

        configurationStylesheetUpdated(update: { configuration: string, stylesheet: string, resource: string } | DataSource) {
            this.dataSource = update;
            if (update.resource) this.addNode.show(update.resource);
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
