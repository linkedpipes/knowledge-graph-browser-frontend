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

    console.log(this.facets);

    let dynamicFacets = new Set();

    const testNode = this.graph.nodes["http://www.wikidata.org/entity/Q937"];

    this.findFacets(dynamicFacets, testNode);
    console.log(dynamicFacets)
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

  findFacets(dynamicFacets, initialNode) {
    // Implement DFS
    let stack = [];

    const maxDepth = 2;

    stack.push({
      node: initialNode,
      depth: 0,
      path: "",
      parentNode: null
    });

    while (stack.length > 0) {
      const currentNodeInfo = stack.pop();

      //  Do not look for facets further from initialNode
      //  than the specified depth
      if (currentNodeInfo.depth > maxDepth) {
        continue;
      }

      // Insert node's neighbours to the stack
      for (const edge of currentNodeInfo.node.connectedEdges) {
        // Skip the "parent" node
        if (edge.otherNode == currentNodeInfo.parentNode) {
          continue;
        }

        stack.push({
          node: edge.otherNode,
          depth: currentNodeInfo.depth + 1,
          // cesta by mala obsahovať aj šípky
          path: currentNodeInfo.path + (currentNodeInfo.path == "" ? "" : "/") + edge.type.label,
          parentNode: currentNodeInfo.node
        })
      }

      // Process the current node
      // Skip the initial node
      if (currentNodeInfo.depth == 0) {
        continue
      }

      dynamicFacets.add({name: currentNodeInfo.node.currentView.preview.label, path: currentNodeInfo.path});




    }

  }
}
</script>

<style/>