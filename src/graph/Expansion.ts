import { Node } from "./Node";
import { Edge } from "./Edge";

/**
 * Expansion stores graph of verticles and edges expanded from parentNode node.
 * Todo: Should somehow support filters
 */
export class Expansion {
    /**
     * Node where expansion started
     */
    parentNode: Node;

    nodes: Node[] = [];
    edges: Edge[] = [];

    /**
     * Creates new Expansion - subgraph with own list of nodes and eges
     * @param initiator Expanded node
     */
    constructor(initiator: Node) {
        this.parentNode = initiator;
    }

    getAllNodes = () => this.nodes;
    getAllEdges = () => this.edges;

    getNodes = () => this.getAllNodes();
    getEdges = () => this.getAllEdges();
}
