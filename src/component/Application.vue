<template>
    <v-app class="app">
        <v-toolbar style="flex: none;">
            <v-toolbar-items>
                <v-btn @click="$refs.addNode.show()" text>Add node</v-btn>
                <v-btn @click="expandAll" text>[Experimental] expand all</v-btn>
            </v-toolbar-items>

            <div class="flex-grow-1"></div>

            <v-toolbar-items>
                <v-btn @click="$refs.configurationStylesheetDialog.show()" text>Change configuration and stylesheet</v-btn>
            </v-toolbar-items>
        </v-toolbar>
        <div class="d-flex flex-grow-1" style="overflow: hidden;">
            <graph-area ref="graphArea" :application-data="data" />
            <div style="overflow: auto;" :class="{'detail-panel-active': true}">
                <detail-panel ref="detail"/>
            </div>
        </div>
        <add-node ref="addNode" :application-data="data"></add-node>

        <configuration-stylesheet-dialog
            ref="configurationStylesheetDialog"
            :oldConfiguration="configurationIRI"
            :oldStylesheet="stylesheetIRI"
            @changed="configurationStylesheetUpdated"
        ></configuration-stylesheet-dialog>
    </v-app>
</template>

<script lang="ts">
import GraphArea from './GraphArea.vue';
import DetailPanel from './DetailPanel.vue';
import AddNode from './AddNode.vue';
import ConfigurationStylesheetDialog from './ConfigurationStylesheetDialog.vue'
import { Graph } from '../graph/Graph';
export default {
    data: function() {
        return {
            configurationIRI: null as String,
            stylesheetIRI: null as String,
            test: Object
        };
    },
    components: {
        DetailPanel,
        GraphArea,
        AddNode,
        ConfigurationStylesheetDialog
    },
    mounted: function() {
        this.$refs.configurationStylesheetDialog.show();
/*         this.$refs.graphArea.mount(this.data.graph);
        (<Graph>this.data.graph).CyInstance.on("tap", "node", async (evt) => {
            let node: Node = evt.target.scratch("_node");
            console.log("Clicked on node", node, this.$refs);
            this.$refs.detail.mountNode(node);
        });
 */    },
    created: function() {
        this.data = {
            graph: null as Graph
        }


 /*        // Set new non-reactive property
        this.data.graph = new Graph();

        let graph: Graph = this.data.graph;

        graph.fetchNode("http://www.wikidata.org/entity/Q7377").then(n => n.show());

        //let ss = await this.fetcher.getStylesheet("https://linked.opendata.cz/resource/knowledge-graph-browser/rpp/style-sheet");
        graph.fetcher.getStylesheet("https://linked.opendata.cz/resource/knowledge-graph-browser/wikidata/animals/style-sheet")
            .then(ss => this.data.graph.CyInstance.style(ss.styles.map(style => { return {selector: style.selector, css: style.properties}})));
 */    },
    methods: {
        configurationStylesheetUpdated: function(update: {configuration: string, stylesheet: string, predefinedStartedNodeIRI: string}) {
            let confChanged = update.configuration != this.configurationIRI;

            // First chceck if configuration was updated
            if (confChanged) {
                if (this.configurationIRI) {
                    // Need to properly unmount
                    this.$refs.graphArea.unmount();
                    this.$refs.detail.unmount();
                }

                // Set new non-reactive property
                this.data.graph = new Graph(update.configuration);
                this.configurationIRI = update.configuration;

                // Mount graph instance
                this.$refs.graphArea.mount();
            }

            // Update stylesheet
            if (confChanged || update.stylesheet != this.stylesheetIRI) {
                (<Graph>this.data.graph).fetcher.getStylesheet(update.stylesheet)
                .then(ss => this.data.graph.CyInstance.style(ss.styles.map(style => { return {selector: style.selector, css: style.properties}})));

                this.stylesheetIRI = update.stylesheet;
            }

            // Mounting
            if (confChanged) {
                (<Graph>this.data.graph).CyInstance.on("tap", "node", async (evt) => {
                    let node: Node = evt.target.scratch("_node");
                    this.$refs.detail.mountNode(node);
                });

                // Show add node dialog
                this.$refs.addNode.show(update.predefinedStartedNodeIRI);
            }
        },
        expandAll: function() {
            let graph: Graph = this.data.graph;

            graph.getAllNodes().forEach(node => {
                node.getViewSets().then(() => {
                    for (let vs in node.viewSets) {
                        for (let v in node.viewSets[vs].views) {
                            node.viewSets[vs].views[v].use();
                            node.viewSets[vs].views[v].expand().then(expansion => {
                                expansion.nodes.forEach(n => {n.cyInstance.removeStyle("display")});
                                expansion.edges.forEach(n => {n.cyInstance.removeStyle("display")});
                                graph.CyInstance.layout({name: 'grid'}).run();
                            });
                        }
                    }
                });
            });
        }
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

.detail-panel-active {
    width: 30%;
}
</style>
