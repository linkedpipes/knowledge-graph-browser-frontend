<template>
    <div>
        <node-vuex v-for="node in graph.nodes" :key="node.identifier" :node="node" />
    </div>
</template>

<script lang="ts">
import {Component, Prop} from "vue-property-decorator";
import Vue from "vue";
import {Graph} from "../Graph";
import NodeVuex from "./NodeVuex";
import NodeCommon from "../NodeCommon";
import GroupEdge from "../GroupEdge";
import EdgeCommon from "../EdgeCommon";
@Component({
    components: {NodeVuex}
})
export default class GraphVuex extends Vue {
    @Prop(Object) graph !: Graph;

    mounted() {
        this.graph.vuexComponent = this;
    }

    public get nodesVisual(): NodeCommon[] {
        return this.graph.nocache_nodesVisual;
    }

    public get groupEdges(): GroupEdge[] {
        return this.graph.nocache_groupEdges;
    }

    public get edgesVisual(): EdgeCommon[] {
        return this.graph.nocache_edgesVisual;
    }
}
</script>
