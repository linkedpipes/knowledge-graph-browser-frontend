import { NodeData } from "./NodeData";
import { Expansion } from "./Expansion";
import { NodeType } from "./NodeType";
import { GraphData, Graph } from "./Graph";


/**
 * Node as a part of graph. Each Node belongs to exactly one Graph.
 */
export class Node {

    nodeData: NodeData;

    cyInstance: Cy.CollectionElements;

    /**
     * Each Node must belong to one and only one Graph. Every update is reported to the graph instance. Also provides fetcher.
     */
    graph: Graph;

    /**
     * Helper variables used by Graph class
     */
    graphData: GraphData;

    //nodeType: NodeType;

    /**
     * List of expansions from this node
     */
    expansions: {[IRI: string]: Expansion} = {};

    /**
     * IRI of the node
     */
    get IRI(): string {
        return this.nodeData.IRI;
    }

    /**
     * Active view used for detail
     */
    //detailView: string;

    constructor(graph: Graph, nodeData: NodeData) {
        this.graph = graph;
        this.nodeData = nodeData;
        this.graphData = new GraphData();
    }

    async expand(viewIRI: string): Promise<Expansion> {
        // Get the expansion
        let expansionData = await this.graph.fetcher.getExpansion(viewIRI, this.IRI);

        let expansion = new Expansion(this);

        // Create nodes
        for (let expansionNode of expansionData.nodes) {
            let node = this.graph.nodes[expansionNode.iri];
            if (!node) {
                // We have to create a new one
                node = new Node(this.graph, null);
                this.graph.nodes[expansionNode.iri] = node;
            }

            expansion.nodes.push(node);
        }

        // Create edges
        for (let expansionEdge of expansionData.edges) {
            // todo
        }

        graph.triggerElementsAddedFrom(expansion);

        return expansion;
    }

    /**
     * Set Nodes detail 
     * @param node 
     * @param viewIRI 
     */
    async getDetail(viewIRI: string) {
        let detailData = await this.fetcher.getDetail(viewIRI, node.IRI);
        node.nodeData.details[viewIRI] = detailData;
        // todo does it return Promise?
    }

    async getPreview(node: Node, viewIRI: string) {
        let previewData = await this.graph.fetcher.getPreview(viewIRI, node.IRI);
        node.nodeData.previews[viewIRI] = previewData;
    }
}