import Vue from 'vue'

export class DynamicallyGeneratedFacets {
    static facets;

    static facetsIndexes;


    static findOrUpdateInitialDynamicFacets(nodes) {
        for (const node of nodes) {
            DynamicallyGeneratedFacets.createOrUpdateTypeFacet(node);

            DynamicallyGeneratedFacets.findOrUpdateDFSLabelFacets(node);

            DynamicallyGeneratedFacets.createOrUpdateTotalNumOfEdgesFacet(node);
        }
    }

    static findOrUpdateDynamicFacetsAfterExpansion(sourceNode, addedNodes) {
        // DFS facety pre source a vsetkych jeho susedov - podla nastavenia do akej hlbky sa maju facety hladat

        DynamicallyGeneratedFacets.createOrUpdateTotalNumOfEdgesFacet(sourceNode);

        for (const addedNode of addedNodes) {
            DynamicallyGeneratedFacets.createOrUpdateTypeFacet(addedNode);

            DynamicallyGeneratedFacets.createOrUpdateTotalNumOfEdgesFacet(addedNode);
        }
    }

    static updateDynamicFacetsUponDeletion(deletedNode) {
        //  Update facet values for deleted node's neighbours
        for (const edge of deletedNode.connectedEdges) {
            const neighbour = edge.otherNode;

            DynamicallyGeneratedFacets.createOrUpdateTotalNumOfEdgesFacet(neighbour);
        }

        DynamicallyGeneratedFacets.findNewExtremaForNumericFacets();
    }

    // Finds possibly new facet extrema
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

    static findOrUpdateDFSLabelFacets(node) {

    }

    static findOrUpdateCountEdgesTypesFacets(node, facets) {

    }

    // Creates or updates a facet to filter by number of edges
    static createOrUpdateTotalNumOfEdgesFacet(node) {
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

    static findOrUpdateNumOfIncomingEdgesFacet(node) {

    }

    static findOrUpdateNumOfOutgoingEdgesFacet(node) {

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