import { Node } from "./Node";
import { Edge } from "./Edge";

/**
 * Graph class represents graph as a whole structure with additional methods for linking to
 */
export class Graph {
    nodes: {
        [IRI: string]: Node;
    } = {};

    edges: {
        [Edge_identifier: string]: Edge;
    } = {};

    /**
     * Returns existing node by its IRI
     * @param IRI
     */
    getNodeByIRI(IRI: string): Node|null {
        return this.nodes[IRI];
    }

    /**
     * Creates a new Node wich is properly registered
     * @param IRI
     */
    createNode(IRI: string): Node {
        let node = new Node(IRI, this);
        this.nodes[IRI] = node;
        return node;
    }

    removeNode(IRI: string) {

    }

    createEdge(): Edge {
        let edge = new Edge(this);
        return edge;
    }

    removeEdge() {

    }

    /**
     * Creates a new node in the graph based on its IRI
     * @param IRI
     */
/*    async fetchNode(IRI: string): Promise<Node> {
        // The node is always registered despite the correctness of IRI
        let node = this.registerNode(IRI);

        try {
            await node.getViewSets();

            if (Object.keys(node.viewSets).length == 0) {
                throw new Error("Server responded, but no view sets returned. Probably wrong IRI specified.");
            }
        } catch(error) { // The node is removed and error is rethrowed
            this.unregisterNode(node);
            node = null;
            throw(error);
        }

        if (node) {
            node.viewSets[Object.keys(node.viewSets)[0]].defaultView.use();
        }
        return node;
    }*/
}
