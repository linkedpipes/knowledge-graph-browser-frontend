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
    let dynamicFacets = new Map();

    // Create a facet for filtering by types of nodes
    const typeFacet = {
      title: "Type of node",

      type: "label",
      description: "Filters nodes by their types.",
      values: {
        displayLabels: [],
        selectedLabels: []
      },
      index: new Map()
    };

    dynamicFacets.set("typeFacetID", typeFacet);

    // Create a facet to filter by number of edges
    const numOfEdgesFacet = {
      title: "Number of edges",
      type: "numeric",
      description: "Facet to filter by number of edges of a node.",
      values: {
        minPossible: Number.MAX_VALUE,
        maxPossible: Number.MIN_VALUE,
        selectedRange: [Number.MIN_VALUE, Number.MAX_VALUE]
      },
      index: []
    };

    dynamicFacets.set("numOfEdgesFacetID", numOfEdgesFacet);

    // Create a facet to filter by number of incoming edges
    const numOfIncomingEdgesFacet = {
      title: "Number of incoming edges",
      type: "numeric",
      description: "Facet to filter by number of incoming edges of a node.",
      values: {
        minPossible: Number.MAX_VALUE,
        maxPossible: Number.MIN_VALUE,
        selectedRange: [Number.MIN_VALUE, Number.MAX_VALUE]
      },
      index: []
    };

    dynamicFacets.set("numOfIncomingEdgesID", numOfIncomingEdgesFacet);

    // Create a facet to filter by number of outgoing edges
    const numOfOutgoingEdgesFacet = {
      title: "Number of outgoing edges",
      type: "numeric",
      description: "Facet to filter by number of outgoing edges of a node.",
      values: {
        minPossible: Number.MAX_VALUE,
        maxPossible: Number.MIN_VALUE,
        selectedRange: [Number.MIN_VALUE, Number.MAX_VALUE]
      },
      index: []
    };

    dynamicFacets.set("numOfOutgoingEdgesID", numOfOutgoingEdgesFacet);

    // Find facets for nodes
    for (const nodeIRI in this.graph.nodes) {
      const node = this.graph.nodes[nodeIRI];

      this.updateTypeFacet(node, typeFacet);

      this.updateNumOfEdgesFacet(node, numOfEdgesFacet);

      this.findLabelFacets(node, dynamicFacets);

      this.findNumericFacets(node, dynamicFacets);
    }

    // Update count edges facets so that nodes can have 0 edges
    // of a specific type and be filtered by that count
    let allEdgesTypes = this.getAllEdgesTypes();

    for (const nodeIRI in this.graph.nodes) {
      const node = this.graph.nodes[nodeIRI];

      this.addZeroValuesToCountEdgesFacets(node, dynamicFacets, allEdgesTypes);
    }

    for (const facetID of dynamicFacets.keys()) {
      this.facets.push(dynamicFacets.get(facetID));
    }
  }

  // Update the type facet with the given node
  updateTypeFacet(node, typeFacet) {
    const nodeLabel = node.currentView.preview.type.label;

    if (typeFacet.index.get(nodeLabel) == undefined) {
      typeFacet.index.set(
          nodeLabel,
          [node.IRI]
      );

      typeFacet.values.displayLabels.push(nodeLabel)
    } else {
      typeFacet.index.get(nodeLabel).push(node.IRI);
    }
  }

  updateNumOfEdgesFacet(node, numOfEdgesFacet) {
    const numOfEdges = node.connectedEdges.length;

    numOfEdgesFacet.index.push({
      nodeIRI: node.IRI,
      value: numOfEdges
    });

    if (numOfEdges < numOfEdgesFacet.values.minPossible) {
      numOfEdgesFacet.values.minPossible = numOfEdges;
      numOfEdgesFacet.values.selectedRange[0] = numOfEdges;
    }

    if (numOfEdges > numOfEdgesFacet.values.maxPossible) {
      numOfEdgesFacet.values.maxPossible = numOfEdges;
      numOfEdgesFacet.values.selectedRange[1] = numOfEdges;
    }
  }

  findLabelFacets(initialNode, dynamicFacets) {
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

  // Finds numeric values for these facets: number
  // of edges of specific types and number of
  // incoming/outgoing edges
  findNumericFacets(node, dynamicFacets) {
    // Number of edges of specific types facet
    // Count occurrences of edge types for node
    let edgesCounts = new Map();

    let numOfIncomingEdges = 0;
    let numOfOutgoingEdges = 0;

    for (const edge of node.connectedEdges) {
      const edgeID = "count " + edge.type.iri + " (" + edge.orientation + ")";

      const currentCount = edgesCounts.get(edgeID) == undefined ? 0 : edgesCounts.get(edgeID).count;

      edgesCounts.set(
          edgeID,
          {
            label: edge.type.label,
            count: currentCount + 1,
            orientation: edge.orientation
          });

      if (edge.orientation == "incoming") {
        numOfIncomingEdges += 1;
      } else {
        numOfOutgoingEdges += 1;
      }
    }

    // Create facets or update their indexes
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

    // Number of incoming edges facet
    dynamicFacets.get("numOfIncomingEdgesID").index.push({
      nodeIRI: node.IRI,
      value: numOfIncomingEdges
    });

    if (numOfIncomingEdges < dynamicFacets.get("numOfIncomingEdgesID").values.minPossible) {
      dynamicFacets.get("numOfIncomingEdgesID").values.minPossible = numOfIncomingEdges;
      dynamicFacets.get("numOfIncomingEdgesID").values.selectedRange[0] = numOfIncomingEdges;
    }

    if (numOfIncomingEdges > dynamicFacets.get("numOfIncomingEdgesID").values.maxPossible) {
      dynamicFacets.get("numOfIncomingEdgesID").values.maxPossible = numOfIncomingEdges;
      dynamicFacets.get("numOfIncomingEdgesID").values.selectedRange[1] = numOfIncomingEdges;
    }

    // Number of outgoing edges facet
    dynamicFacets.get("numOfOutgoingEdgesID").index.push({
      nodeIRI: node.IRI,
      value: numOfOutgoingEdges
    });

    if (numOfOutgoingEdges < dynamicFacets.get("numOfOutgoingEdgesID").values.minPossible) {
      dynamicFacets.get("numOfOutgoingEdgesID").values.minPossible = numOfOutgoingEdges;
      dynamicFacets.get("numOfOutgoingEdgesID").values.selectedRange[0] = numOfOutgoingEdges;
    }

    if (numOfOutgoingEdges > dynamicFacets.get("numOfOutgoingEdgesID").values.maxPossible) {
      dynamicFacets.get("numOfOutgoingEdgesID").values.maxPossible = numOfOutgoingEdges;
      dynamicFacets.get("numOfOutgoingEdgesID").values.selectedRange[1] = numOfOutgoingEdges;
    }
  }

  // Finds all types of edges in graph
  getAllEdgesTypes() {
    let edgesTypes = new Set<string>();

    for (const edgeTripleString in this.graph.edges) {
      const edge = this.graph.edges[edgeTripleString];
      // Add both directions of edge
      edgesTypes.add("count " + edge.type.iri + " (outgoing)");
      edgesTypes.add("count " + edge.type.iri + " (incoming)");
    }

    return edgesTypes;
  }

  addZeroValuesToCountEdgesFacets(node, dynamicFacets, allEdgesTypes) {
    // Add edges types that the node doesn't possess
    // to the facet's index so that the node can have
    // 0 edges and be filtered
    // Count occurrences of edge types for node
    let edgesCounts = new Map();

    for (const edge of node.connectedEdges) {
      const edgeID = "count " + edge.type.iri + " (" + edge.orientation + ")";

      const currentCount = edgesCounts.get(edgeID) == undefined ? 0 : edgesCounts.get(edgeID).count;

      edgesCounts.set(
          edgeID,
          {
            label: edge.type.label,
            count: currentCount + 1,
            orientation: edge.orientation
          });
    }

    // Create a set from edgesCounts.keys
    const nodePresentEdges = new Set();

    for (const edgeID of edgesCounts.keys()) {
      nodePresentEdges.add(edgeID);
    }

    // Difference between two sets: allEdgesTypes \ nodePresentEdges = nodeAbsentEdges
    const nodeAbsentEdges = new Set([...allEdgesTypes].filter(edge => !nodePresentEdges.has(edge)));

    for (const absentEdge of nodeAbsentEdges.values()) {
      // Check if the facet's minimum needs to be updated
      if (0 < dynamicFacets.get(absentEdge).values.minPossible) {
        dynamicFacets.get(absentEdge).values.minPossible = 0;
        dynamicFacets.get(absentEdge).values.selectedRange[0] = 0;
      }

      // Update facet's index
      dynamicFacets.get(absentEdge).index.push(
          {
            nodeIRI: node.IRI,
            value: 0
          }
      );
    }
  }
}
</script>

<style/>