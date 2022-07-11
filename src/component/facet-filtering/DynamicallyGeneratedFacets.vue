<template/>

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
      const node = this.graph.nodes[nodeIRI];

      this.findLabelFacets(dynamicFacets, node);
      this.findCountEdgesFacets(dynamicFacets, node);
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

  findLabelFacets(dynamicFacets, initialNode) {
    // Implement DFS to find label type facets locally
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
          iri: edge.type.iri,
          orientation: edge.orientation,
          label: edge.type.label
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
        facetPath += (facetPath == "" ? "" : " / ") + edge.iri + " (" + edge.orientation + ")";
      }

      const facet = dynamicFacets.get(facetPath);

      // Check if the facet is newly found
      if (facet == undefined) {
        let facetTitle = "";

        for (const edge of currentNodeInfo.path) {
          facetTitle += (facetTitle == "" ? "" : " / ") + edge.label + " (" + edge.orientation + ")";
        }

        const newFacet = {
          title: facetTitle,
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

  // Find numeric facets - number of edges of specific types
  findCountEdgesFacets(dynamicFacets, node) {
    let edgesCounts = new Map();

    for (const edge of node.connectedEdges) {
      const edgeID = "count " + edge.type.iri + " (" + edge.orientation +")";

      const currentCount = edgesCounts.get(edgeID) == undefined ? 0 : edgesCounts.get(edgeID).count;

      edgesCounts.set(
          edgeID,
          {
            label: edge.type.label,
            count: currentCount + 1,
            orientation: edge.orientation
          });
    }

    for (const facetID of edgesCounts.keys()) {
      const count = edgesCounts.get(facetID).count;

      //  Check if the facet is undefined
      const facet = dynamicFacets.get(facetID);

      if (facet == undefined) {
        //  Create a new facet
        const facetEdge = edgesCounts.get(facetID);

        const newFacet = {
          title: "count - " + facetEdge.label + " (" + facetEdge.orientation + ")",
          type: "numeric",
          description: "This facet was found dynamically and has no human-defined description.",
          values: {
            minPossible: count,
            maxPossible: count,
            selectedRange: [count, count]
          },
          index: []
        };

        newFacet.index.push(
            {
              nodeIRI: node.IRI,
              value: count
            });

        dynamicFacets.set(facetID, newFacet);
      } else {
        // Update the facet's extrema
        if (count < facet.values.minPossible) {
          facet.values.minPossible = count;
          facet.values.selectedRange[0] = count;
        }

        if (count > facet.values.maxPossible) {
          facet.values.maxPossible = count;
          facet.values.selectedRange[1] = count;
        }

        // Update the facet's index
        facet.index.push(
            {
              nodeIRI: node.IRI,
              value: count
            });
      }
    }
  }
}
</script>

<style/>