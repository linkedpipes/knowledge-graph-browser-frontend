<template>
  <v-btn @click="loadDynamicFacets" block>Load dynamic facets</v-btn>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from "vue";
import {Prop} from "vue-property-decorator";

@Component
export default class DynamicallyGeneratedFacets extends Vue {
  @Prop() facets;
  @Prop() graph;

  loadDynamicFacets() {
    this.addEdgesToNodes();

    console.log(this.graph);
  }

  addEdgesToNodes() {
    // Add edges to nodes so that I can use DFS on them later
    for (const edgeTripleString in this.graph.edges) {
      const edge = this.graph.edges[edgeTripleString];

      //  Add edge to the source node
      this.graph.nodes[edge.source.IRI].connectedEdges.push({
        otherNode: edge.target,
        direction: "outgoing",
        type: edge.type
      });

      //  Add edge to the target node
      this.graph.nodes[edge.target.IRI].connectedEdges.push({
        otherNode: edge.source,
        direction: "incoming",
        type: edge.type
      });
    }
  }
}
</script>

<style/>