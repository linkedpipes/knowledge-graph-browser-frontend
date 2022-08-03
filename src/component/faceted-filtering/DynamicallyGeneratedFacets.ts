export class DynamicallyGeneratedFacets {
    static facets;

    static facetsIndexes;


    static findOrUpdateInitialDynamicFacets(nodes) {
        for (const node of nodes) {
            DynamicallyGeneratedFacets.findOrUpdateDynamicFacets(node);
        }
    }

    static findOrUpdateDynamicFacetsAfterExpansion(sourceNode, addedNodes) {
        for (const addedNode of addedNodes) {
            DynamicallyGeneratedFacets.findOrUpdateDynamicFacets(addedNode);
        }
    }

    static findOrUpdateDynamicFacets(node) {
        DynamicallyGeneratedFacets.createOrUpdateTypeFacet(node);
    }

    static findOrUpdateDFSLabelFacets(node, facets) {

    }

    static findOrUpdateCountEdgesTypesFacets(node, facets) {

    }

    static findOrUpdateNumOfEdgesFacet(node, facets) {

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