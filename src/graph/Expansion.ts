import { Node } from "./Node";

/**
 * Expansion is a structure which stores expanded vertices and edges of the graph
 */
export class Expansion {
    /**
     * Node where expansion started
     */
    parentNode: Node;

    /**
     * List of nodes which the expansion from parentNode expands
     */
    nodes: Node[] = [];

    /**
     * List of edges connecting only nodes and parentNode
     */
    //edges: Edge[] = [];

    constructor(initiator: Node) {
        this.parentNode = initiator;
    }
}