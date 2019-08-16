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
     * Each Node must belong to at most one Graph. If so, for any change of node
     * the parent graph should be informed.
     */
    graph: Graph = null;

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

    constructor(nodeData: NodeData) {
        this.nodeData = nodeData;
        this.graphData = new GraphData();
    }
}