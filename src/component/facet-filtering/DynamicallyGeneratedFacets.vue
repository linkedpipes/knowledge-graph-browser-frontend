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

    let dynamicFacets = new Map();

    for (const nodeIRI in this.graph.nodes) {
      this.findFacets(dynamicFacets, this.graph.nodes[nodeIRI]);
    }

    for (const facetPath of dynamicFacets.keys()) {
      this.facets.push(dynamicFacets.get(facetPath));
    }
  }

  addEdgesToNodes() {
    // Add edges to nodes so that I can use DFS on them later
    for (const edgeTripleString in this.graph.edges) {
      const edge = this.graph.edges[edgeTripleString];

      //  Add edge to the source node
      this.graph.nodes[edge.source.IRI].connectedEdges.push({
        otherNode: edge.target,
        orientation: "outgoing",
        type: edge.type
      });

      //  Add edge to the target node
      this.graph.nodes[edge.target.IRI].connectedEdges.push({
        otherNode: edge.source,
        orientation: "incoming",
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
      path: [],
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

        let path = [];

        // Copy the current path and add edge to it
        currentNodeInfo.path.forEach(val => path.push(Object.assign({}, val)));

        path.push({
          label: edge.type.label,
          orientation: edge.orientation
        });

        stack.push({
          node: edge.otherNode,
          depth: currentNodeInfo.depth + 1,
          path: path,
          parentNode: currentNodeInfo.node
        })
      }

      // Process the current node
      // Skip the initial node
      if (currentNodeInfo.depth == 0) {
        continue
      }

      // Reconstruct path for hashing purposes
      let facetPath = "";

      for (const edge of currentNodeInfo.path) {
        facetPath += (facetPath == "" ? "" : " / ") + edge.label + " (" + edge.orientation + ")";
      }

      const facet = dynamicFacets.get(facetPath);

      // Check if the facet is newly found
      if (facet == undefined) {
        const newFacet = {
          iri: "",
          title: facetPath,
          type: "label",
          description: "This facet was found dynamically and has no human-defined description.",
          values: {
            displayLabels: [],
            selectedLabels: []
          },
          index: new Map()
        };

        const currentNodeLabel = currentNodeInfo.node.currentView.preview.label;

        newFacet.index.set(currentNodeLabel, [initialNode.IRI]);

        newFacet.values.displayLabels.push(currentNodeLabel);

        dynamicFacets.set(facetPath, newFacet);
      } else {
        // Update the facet's index
        const currentNodeLabel = currentNodeInfo.node.currentView.preview.label;

        if (facet.index.get(currentNodeLabel) == undefined) {
          facet.index.set(currentNodeLabel, [initialNode.IRI]);

          facet.values.displayLabels.push(currentNodeLabel);
        } else {
          facet.index.get(currentNodeLabel).push(initialNode.IRI);
        }
      }
    }
  }
}
</script>

<style/>