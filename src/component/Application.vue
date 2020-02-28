<template>
    <v-app class="app">
        <v-toolbar style="flex: none;">
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
                <v-btn click="$refs.configurationStylesheetDialog.show()" text>{{ $t("change_configuration_and_stylesheet") }}</v-btn>
            </v-toolbar-items>

            <template #extension>
                <span class="mr-2" v-if="!filter_active">No vertices were filtered out.</span>
                <span class="mr-2" v-if="filter_active">Filtered by:</span>
                <span class="filter-list" v-if="filter_active">
                    <v-chip close><b>Degree</b>&nbsp;at least 5</v-chip>
                    <v-chip close color="secondary" class="pa-5"> <v-chip close><b>Degree</b>&nbsp;at least 5</v-chip> OR <v-chip close><b>Degree</b>&nbsp;at least 5</v-chip></v-chip>
                </span>
                <v-toolbar-items>
                <v-btn text>Add a new filter</v-btn>
                </v-toolbar-items>
            </template>
        </v-toolbar>
        <div class="d-flex flex-grow-1" style="overflow: hidden;">
            <graph-area :graph="graph" />
            <side-panel :graph="graph"/>
        </div>

        <add-node ref="addNode" :graph="graph" />
        <save-dialog ref="saveDialog" />
        <configuration-stylesheet-dialog
            ref="configurationStylesheetDialog"
            :oldConfiguration="configurationIRI"
            :oldStylesheet="stylesheetIRI"
            @changed="configurationStylesheetUpdated"
        />
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

export default {
    data: function() {
        let fetcher = new DataGraphFetcher("http://localhost:3000/", "https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/psp");
        let graph = new Graph(fetcher);

        graph.createNode("https://psp.opendata.cz/zdroj/osoba/5914").useDefaultView().then((view) => view.fetchPreview());
        graph.createNode("https://psp.opendata.cz/zdroj/osoba/5915").useDefaultView().then((view) => view.fetchPreview());

        return {
            configurationIRI: null as String,
            stylesheetIRI: null as String,
            remoteURL: "http://localhost:3000/",
            graph: graph,
            filter_active: false,
            truefalse: false
        };
    },
    created: function () {
        this.fetcher = new DataGraphFetcher(this.remoteURL, null);
        this.translations = [];
        for (let code in this.$root.$i18n.messages) {
            this.translations.push({
                text: this.$root.$i18n.messages[code]['_lang_local'],
                value: code
            });
        }
    },
    watch: {
        configurationIRI: function(IRI: string) {
            //this.graph.edges = {};
            //this.graph.nodes = {};
            this.fetcher = new DataGraphFetcher(this.remoteURL, IRI);
        },

        stylesheetIRI: function(stylesheet: string) {
            this.stylesheetData = {};
            //this.fetcher.getStylesheet(stylesheet).then(ss => this.data.graph.CyInstance.style(ss.styles.map(style => { return {selector: style.selector, css: style.properties}})));
        }
    },
    components: {
        GraphArea,

        // Component responsible for window where user can add new nodes
        AddNode,

        // Right-side pannel for detail about nodes
        SidePanel,
        ConfigurationStylesheetDialog,
        SaveDialog,
    },
    mounted: function() {
        this.$refs.configurationStylesheetDialog.show();
    },

    methods: {
        configurationStylesheetUpdated: function(update: {configuration: string, stylesheet: string, predefinedStartedNodeIRI: string}) {
            this.configurationIRI = update.configuration;
            this.stylesheetIRI = update.stylesheet;
        },
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
</style>
