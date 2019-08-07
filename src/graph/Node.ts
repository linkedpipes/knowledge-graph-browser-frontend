import { NodeData } from "./NodeData";
import { Expansion } from "./Expansion";
import { NodeType } from "./NodeType";
import { GraphData } from "./Graph";


/**
 * Node as a part of graph. Each Node belongs to exactly one Graph.
 */
export class Node {
    /**
     * Node data are stored in the separate structure because of possibility of multiple graphs
     * NodeData will be passed to Cytoscape as node data
     */
    nodeData: NodeData;

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