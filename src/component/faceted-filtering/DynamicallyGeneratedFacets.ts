import Vue from 'vue'

export class DynamicallyGeneratedFacets {
    static facets;

    static facetsIndexes;

    static maxDepth = 2;

    /**
     * Computes facets from current graph's state.
     */
    static updateInitialDynamicFacets(nodes) {
        for (const node of nodes) {
            DynamicallyGeneratedFacets.updateTypeFacet(node);

            DynamicallyGeneratedFacets.updateEdgesFacets(node);

            DynamicallyGeneratedFacets.updateDFSLabelFacets(node);
        }
    }

    /**
     * Re-computes facets for nodes affected by an expansion.
     */
    static updateDynamicFacetsAfterExpansion(sourceNode, addedNodes) {
        DynamicallyGeneratedFacets.updateEdgesFacets(sourceNode);

        DynamicallyGeneratedFacets.updateDFSLabelFacets(sourceNode);

        for (const addedNode of addedNodes) {
            DynamicallyGeneratedFacets.updateTypeFacet(addedNode);

            DynamicallyGeneratedFacets.updateEdgesFacets(addedNode);

            DynamicallyGeneratedFacets.updateDFSLabelFacets(addedNode);
        }
    }

    /**
     * Updates facet values for deleted node's neighbours.
     */
    static updateDynamicFacetsUponDeletion(deletedNode) {
        for (const edge of deletedNode.connectedEdges) {
            const neighbour = edge.otherNode;

            DynamicallyGeneratedFacets.updateEdgesFacets(neighbour);

            DynamicallyGeneratedFacets.updateDFSLabelFacets(neighbour);
        }

        DynamicallyGeneratedFacets.findNewExtremaForNumericFacets();
    }

    /**
     * Finds possibly new numeric facets extrema.
     */
    static findNewExtremaForNumericFacets() {
        for (const facet of this.facets) {
            if (facet == undefined) {
                continue;
            }

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

    /**
     * Finds facets using depth-first search.
     */
    static updateDFSLabelFacets(initialNode) {
        // Implement DFS to find label type facets locally
        let stack = [];

        stack.push({
            node: initialNode,
            depth: 0,
            path: [],
            parentNode: null
        });

        while (stack.length > 0) {
            const currentNodeInfo = stack.pop();

            this.makeDFSStep(currentNodeInfo, stack, initialNode);
        }
    }

    /**
     * Adds neighbours of current node to stack and processes the current node
     * according to the depth-first search algorithm.
     */
    static makeDFSStep(currentNodeInfo, stack, initialNode) {
        //  Do not look for facets further from initialNode
        //  than the specified depth
        if (currentNodeInfo.depth > this.maxDepth) {
            return;
        }

        if (currentNodeInfo.node.currentView == null || currentNodeInfo.node.currentView.preview == null) {
            return;
        }

        this.insertNodesNeighboursToDFSStack(currentNodeInfo, stack);

        this.processCurrentNodeOfDFS(currentNodeInfo, initialNode);
    }

    /**
     * Iterates through current node's edges and adds them to the DFS stack.
     */
    static insertNodesNeighboursToDFSStack(currentNodeInfo, stack) {
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
    }

    /**
     * Creates or updates a facet that is specified by the path
     * from initial node to current node.
     */
    static processCurrentNodeOfDFS(currentNodeInfo, initialNode) {
        // Skip the initial node
        if (currentNodeInfo.depth == 0) {
            return;
        }

        // Reconstruct path for hashing purposes
        let facetPath = "";

        for (const edge of currentNodeInfo.path) {
            facetPath += (facetPath == "" ? "" : " / ") + edge.iri + " (" + edge.orientation + ")";
        }

        // Check if the facet is newly found
        if (this.facetsIndexes.get(facetPath) == undefined) {
            this.createNewDFSLabelFacet(currentNodeInfo, facetPath);
        }

        this.updateDFSLabelFacet(currentNodeInfo, facetPath, initialNode);
    }

    /**
     * Creates a new DFS label facet based on the path from
     * initial node to current node.
     */
    static createNewDFSLabelFacet(currentNodeInfo, facetPath) {
        let facetTitle = "";

        for (const edge of currentNodeInfo.path) {
            facetTitle += (facetTitle == "" ? "" : " / ") + edge.label + " (" + edge.orientation + ")";
        }

        let facetDescription = "Filters nodes by this path: " +
            "source node / " + facetPath + " / end node." +
            "The path ends in nodes with chosen labels.";

        const newFacet = {
            id: facetPath,
            title: "Path: " + facetTitle,
            type: "label",
            description: facetDescription,
            values: {
                displayLabels: [],
                selectedLabels: []
            },
            index: new Map()
        };

        this.facetsIndexes.set(newFacet.id, this.facets.length);

        this.facets.push(newFacet);
    }

    /**
     * Updates an existing DFS label facet with current node.
     */
    static updateDFSLabelFacet(currentNodeInfo, facetPath, initialNode) {
        // Update the facet's index
        const pathFacet = this.facets[this.facetsIndexes.get(facetPath)];

        const currentNodeLabel = currentNodeInfo.node.currentView.preview.label;

        if (pathFacet.index.get(currentNodeLabel) == undefined) {
            pathFacet.index.set(
                currentNodeLabel,
                [initialNode.IRI]
            );

            pathFacet.values.displayLabels.push(currentNodeLabel)
        } else {
            pathFacet.index.get(currentNodeLabel).push(initialNode.IRI);
        }
    }

    /**
     * Creates or updates those facets which are concerned with a node's edges.
     */
    static updateEdgesFacets(node) {
        DynamicallyGeneratedFacets.createOrUpdateTotalNumOfEdgesFacet(node);

        if (this.facetsIndexes.get("numOfIncomingEdgesID") === undefined) {
            this.createNumOfIncomingEdgesFacet();
        }

        if (this.facetsIndexes.get("numOfOutgoingEdgesID") === undefined) {
            this.createNumOfOutgoingEdgesFacet();
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
        for (const facetID of edgesCounts.keys()) {
            const count = edgesCounts.get(facetID).count;

            //  Check if the facet is undefined
            if (this.facetsIndexes.get(facetID) == undefined) {
                //  Create a new facet
                const facetEdge = edgesCounts.get(facetID);

                this.createCountEdgeOfTypeFacet(facetID, facetEdge, count);
            }

            this.updateCountEdgeOfTypeFacet(facetID, node, count);
        }

        this.updateNumOfIncomingEdgesFacet(node, numOfIncomingEdges);

        this.updateNumOfOutgoingEdgesFacet(node, numOfOutgoingEdges);
    }

    /**
     * Creates a facet to filter by number of incoming edges.
     */
    static createNumOfIncomingEdgesFacet() {
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

    /**
     * Updates the facet to filter by number of incoming edges.
     */
    static updateNumOfIncomingEdgesFacet(node, numOfIncomingEdges) {
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
    }

    /**
     * Creates a facet to filter by number of outgoing edges.
     */
    static createNumOfOutgoingEdgesFacet() {
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

    /**
     * Updates the facet to filter by number of outgoing edges.
     */
    static updateNumOfOutgoingEdgesFacet(node, numOfOutgoingEdges) {
        // Number of outgoing edges facet
        const numOfOutgoingEdgesFacet = this.facets[this.facetsIndexes.get("numOfOutgoingEdgesID")];

        let itemFound = false;

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

    /**
     * Creates a facet to filter by number of occurrences of an edge of a specific type.
     */
    static createCountEdgeOfTypeFacet(facetID, facetEdge, count) {
        const newFacet = {
            id: facetID,
            title: "Count - " + facetEdge.label + " (" + facetEdge.orientation + ")",
            type: "numeric",
            description: "Filters nodes by number of " + facetEdge.label + " (" + facetEdge.orientation + ") edges.",
            values: {
                minPossible: count,
                maxPossible: count,
                selectedRange: [count, count]
            },
            index: []
        };

        this.facetsIndexes.set(newFacet.id, this.facets.length);

        this.facets.push(newFacet);
    }

    /**
     * Updates the facet to filter by number of occurrences of an edge of a specific type.
     */
    static updateCountEdgeOfTypeFacet(facetID, node, count) {
        const existingFacet = this.facets[this.facetsIndexes.get(facetID)];

        // Update the facet's index
        let indexItemFound = false;

        for (let item of existingFacet.index) {
            if (item.nodeIRI === node.IRI) {
                item.value = count;

                indexItemFound = true;
                break;
            }
        }

        if (!indexItemFound) {
            existingFacet.index.push({
                nodeIRI: node.IRI,
                value: count
            });
        }

        // Update the facet's extrema
        if (count < existingFacet.values.minPossible) {
            existingFacet.values.minPossible = count;
            Vue.set(existingFacet.values.selectedRange, 0, count)
        }

        if (count > existingFacet.values.maxPossible) {
            existingFacet.values.maxPossible = count;
            Vue.set(existingFacet.values.selectedRange, 1, count)
        }
    }

    /**
     * Creates or updates a facet to filter by total number of edges.
     */
    static createOrUpdateTotalNumOfEdgesFacet(node) {
        if (this.facetsIndexes.get("totalNumOfEdgesFacetID") === undefined) {
            this.createTotalNumOfEdgesFacet();
        }

        this.updateTotalNumOfEdgesFacet(node);
    }

    /**
     * Creates a facet to filter by total number of edges.
     */
    static createTotalNumOfEdgesFacet() {
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

    /**
     * Updates the facet to filter by total number of edges.
     */
    static updateTotalNumOfEdgesFacet(node) {
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

    /**
     * Creates or updates facet for filtering by types of nodes.
     */
    static updateTypeFacet(node) {
        if (node.currentView == null || node.currentView.preview == null) {
            return;
        }

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