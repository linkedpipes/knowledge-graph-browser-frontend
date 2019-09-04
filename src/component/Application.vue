<template>
    <v-app>
        <v-toolbar>
            <v-toolbar-items>
                <v-btn @click="dialog = true" text>Add node</v-btn>
            </v-toolbar-items>

            <div class="flex-grow-1"></div>

            <v-toolbar-items>
                <v-btn text>Change configuration</v-btn>
                <v-btn text>Change stylesheet</v-btn>
            </v-toolbar-items>
        </v-toolbar>
        <graph-area :graph-instance="graphInstance" />
        <detail-panel ref="detail"/>



    <add-node :dialog.sync="addNodeDialog" :graph-instance="graphInstance"></add-node>

    </v-app>
</template>

<script lang="ts">
import GraphArea from './GraphArea.vue';
import DetailPanel from './DetailPanel.vue';
import AddNode from './AddNode.vue';
import { Graph } from '../graph/Graph';
export default {
    data: function() {
        return {
            addNodeDialog: false
        };
    },
    components: {
        DetailPanel,
        GraphArea,
        AddNode
    },
    mounted: function() {
        (<Graph>this.graphInstance).CyInstance.on("tap", "node", async (evt) => {
            let node: Node = evt.target.scratch("_node");
            console.log("Clicked on node", node, this.$refs);
            this.$refs.detail.mountNode(node);
        });
    },
    created: function() {
        // Set new non-reactive property
        this.graphInstance = new Graph();

        let graph: Graph = this.graphInstance;

        graph.fetchNode("http://www.wikidata.org/entity/Q7377").then(n => n.show());

        //let ss = await this.fetcher.getStylesheet("https://linked.opendata.cz/resource/knowledge-graph-browser/rpp/style-sheet");
        graph.fetcher.getStylesheet("https://linked.opendata.cz/resource/knowledge-graph-browser/wikidata/animals/style-sheet")
            .then(ss => this.graphInstance.CyInstance.style(ss.styles.map(style => { return {selector: style.selector, css: style.properties}})));

    }
}
</script>