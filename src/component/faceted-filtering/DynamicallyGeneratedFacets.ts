import Vue from 'vue'

export class DynamicallyGeneratedFacets {
    static facets;

    static facetsIndexes;


    static updateInitialDynamicFacets(nodes) {
        for (const node of nodes) {
            DynamicallyGeneratedFacets.createOrUpdateTypeFacet(node);

            DynamicallyGeneratedFacets.updateDFSLabelFacets(node);

            DynamicallyGeneratedFacets.updateEdgesFacets(node);
        }
    }

    static updateDynamicFacetsAfterExpansion(sourceNode, addedNodes) {
        // DFS facety pre source a vsetkych jeho susedov - podla nastavenia do akej hlbky sa maju facety hladat

        DynamicallyGeneratedFacets.updateEdgesFacets(sourceNode);

        for (const addedNode of addedNodes) {
            DynamicallyGeneratedFacets.createOrUpdateTypeFacet(addedNode);

            DynamicallyGeneratedFacets.updateEdgesFacets(addedNode);
        }
    }

    static updateDynamicFacetsUponDeletion(deletedNode) {
        //  Update facet values for deleted node's neighbours
        for (const edge of deletedNode.connectedEdges) {
            const neighbour = edge.otherNode;

            DynamicallyGeneratedFacets.updateEdgesFacets(neighbour);
        }

        DynamicallyGeneratedFacets.findNewExtremaForNumericFacets();
    }

    // Finds possibly new numeric facet extrema
    static findNewExtremaForNumericFacets() {
        for (const facet of this.facets) {
            if (facet.type == "numeric") {
                let newMin = Number.MAX_VALUE;
                let newMax = Number.MIN_VALUE;

                for (const indexItem of facet.index) {
                    if (indexItem.value < newMin) {
                        newMin = indexItem.value;
                    }

                    if (indexItem.value > newMax) {
                        newMax = indexItem.value;
                    }
                }

                facet.values.minPossible = newMin;

                if (facet.values.selectedRange[0] < newMin) {
                    Vue.set(facet.values.selectedRange, 0, newMin);
                }

                facet.values.maxPossible = newMax;

                if (facet.values.selectedRange[1] > newMax) {
                    Vue.set(facet.values.selectedRange, 1, newMax)
                }
            }
        }
    }

    static updateDFSLabelFacets(node) {

    }

    // Creates or updates those facets which are concerned with a node's edges.
    static updateEdgesFacets(node) {
        DynamicallyGeneratedFacets.updateTotalNumOfEdgesFacet(node);

        if (this.facetsIndexes.get("numOfIncomingEdgesID") === undefined) {
            // Create a facet to filter by number of incoming edges
            const numOfIncomingEdgesFacet = {
                id: "numOfIncomingEdgesID",
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

            this.facetsIndexes.set(numOfIncomingEdgesFacet.id, this.facets.length);

            this.facets.push(numOfIncomingEdgesFacet);
        }

        if (this.facetsIndexes.get("numOfOutgoingEdgesID") === undefined) {
            // Create a facet to filter by number of outgoing edges
            const numOfOutgoingEdgesFacet = {
                id: "numOfOutgoingEdgesID",
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

            this.facetsIndexes.set(numOfOutgoingEdgesFacet.id, this.facets.length);

            this.facets.push(numOfOutgoingEdgesFacet);
        }

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
        // for (const facetID of edgesCounts.keys()) {
        //     const count = edgesCounts.get(facetID).count;
        //
        //     //  Check if the facet is undefined
        //     const facet = this.facets.get(facetID);
        //
        //     if (facet == undefined) {
        //         //  Create a new facet
        //         const facetEdge = edgesCounts.get(facetID);
        //
        //         const newFacet = {
        //             title: "count - " + facetEdge.label + " (" + facetEdge.orientation + ")",
        //             type: "numeric",
        //             description: "This facet was found dynamically and has no human-defined description.",
        //             values: {
        //                 minPossible: count,
        //                 maxPossible: count,
        //                 selectedRange: [count, count]
        //             },
        //             index: []
        //         };
        //
        //         newFacet.index.push(
        //             {
        //                 nodeIRI: node.IRI,
        //                 value: count
        //             });
        //
        //         this.facets.set(facetID, newFacet);
        //     } else {
        //         // Update the facet's extrema
        //         if (count < facet.values.minPossible) {
        //             facet.values.minPossible = count;
        //             facet.values.selectedRange[0] = count;
        //         }
        //
        //         if (count > facet.values.maxPossible) {
        //             facet.values.maxPossible = count;
        //             facet.values.selectedRange[1] = count;
        //         }
        //
        //         // Update the facet's index
        //         facet.index.push(
        //             {
        //                 nodeIRI: node.IRI,
        //                 value: count
        //             });
        //     }
        // }

        // Number of incoming edges facet
        const numOfIncomingEdgesFacet = this.facets[this.facetsIndexes.get("numOfIncomingEdgesID")];

        let itemFound = false;

        for (let item of numOfIncomingEdgesFacet.index) {
            if (item.nodeIRI === node.IRI) {
                item.value = numOfIncomingEdges;

                itemFound = true;
                break;
            }
        }

        if (!itemFound) {
            numOfIncomingEdgesFacet.index.push({
                nodeIRI: node.IRI,
                value: numOfIncomingEdges
            });
        }

        if (numOfIncomingEdges < numOfIncomingEdgesFacet.values.minPossible) {
            numOfIncomingEdgesFacet.values.minPossible = numOfIncomingEdges;
            Vue.set(numOfIncomingEdgesFacet.values.selectedRange, 0, numOfIncomingEdges)
        }

        if (numOfIncomingEdges > numOfIncomingEdgesFacet.values.maxPossible) {
            numOfIncomingEdgesFacet.values.maxPossible = numOfIncomingEdges;
            Vue.set(numOfIncomingEdgesFacet.values.selectedRange, 1, numOfIncomingEdges)
        }

        // Number of outgoing edges facet
        const numOfOutgoingEdgesFacet = this.facets[this.facetsIndexes.get("numOfOutgoingEdgesID")];

        itemFound = false;

        for (let item of numOfOutgoingEdgesFacet.index) {
            if (item.nodeIRI === node.IRI) {
                item.value = numOfOutgoingEdges;

                itemFound = true;
                break;
            }
        }

        if (!itemFound) {
            numOfOutgoingEdgesFacet.index.push({
                nodeIRI: node.IRI,
                value: numOfOutgoingEdges
            });
        }

        if (numOfOutgoingEdges < numOfOutgoingEdgesFacet.values.minPossible) {
            numOfOutgoingEdgesFacet.values.minPossible = numOfOutgoingEdges;
            Vue.set(numOfOutgoingEdgesFacet.values.selectedRange, 0, numOfOutgoingEdges)
        }

        if (numOfOutgoingEdges > numOfOutgoingEdgesFacet.values.maxPossible) {
            numOfOutgoingEdgesFacet.values.maxPossible = numOfOutgoingEdges;
            Vue.set(numOfOutgoingEdgesFacet.values.selectedRange, 1, numOfOutgoingEdges)
        }
    }

    // Creates or updates a facet to filter by number of edges
    static updateTotalNumOfEdgesFacet(node) {
        if (this.facetsIndexes.get("totalNumOfEdgesFacetID") === undefined) {
            const numOfEdgesFacet = {
                id: "totalNumOfEdgesFacetID",
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

            this.facetsIndexes.set(numOfEdgesFacet.id, this.facets.length);

            this.facets.push(numOfEdgesFacet);
        }

        const numOfEdgesFacet = this.facets[this.facetsIndexes.get("totalNumOfEdgesFacetID")];

        const numOfEdges = node.connectedEdges.length;

        let itemFound = false;

        for (let item of numOfEdgesFacet.index) {
            if (item.nodeIRI === node.IRI) {
                item.value = numOfEdges;

                itemFound = true;
                break;
            }
        }

        if (!itemFound) {
            numOfEdgesFacet.index.push({
                nodeIRI: node.IRI,
                value: numOfEdges
            });
        }

        if (numOfEdges < numOfEdgesFacet.values.minPossible) {
            numOfEdgesFacet.values.minPossible = numOfEdges;
            Vue.set(numOfEdgesFacet.values.selectedRange, 0, numOfEdges)
        }

        if (numOfEdges > numOfEdgesFacet.values.maxPossible) {
            numOfEdgesFacet.values.maxPossible = numOfEdges;
            Vue.set(numOfEdgesFacet.values.selectedRange, 1, numOfEdges)
        }
    }

    // Creates or updates a facet for filtering by types of nodes
    static createOrUpdateTypeFacet(node) {
        if (this.facetsIndexes.get("typeFacetID") === undefined) {
            const typeFacet = {
                id: "typeFacetID",
                title: "Type of node",
                type: "label",
                description: "Filters nodes by their types.",
                values: {
                    displayLabels: [],
                    selectedLabels: []
                },
                index: new Map()
            };

            this.facetsIndexes.set(typeFacet.id, this.facets.length);

            this.facets.push(typeFacet);
        }

        const typeFacet = this.facets[this.facetsIndexes.get("typeFacetID")];

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

    static setFacets(facets) {
        this.facets = facets;
    }

    static setFacetsIndexes(facetsIndexes) {
        this.facetsIndexes = facetsIndexes;
    }
}