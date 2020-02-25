import { Node } from "./Node";
import { Edge, EdgeType } from "./Edge";
import { DataGraphFetcher } from "../graph-fetcher/DataGraphFetcher";

import Vue from 'vue';

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

    fetcher: DataGraphFetcher = null;
    //readonly configurationIRI: string = null;

/*     constructor(configurationIRI: string) {
        this.configurationIRI = configurationIRI;
    } */

    constructor(fetcher: DataGraphFetcher) {
        this.fetcher = fetcher;
    }

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
        Vue.set(this.nodes, IRI, node); // this.nodes[IRI] = node;
        return node;
    }

    removeNode(IRI: string) {

    }

    private getEdgeIdentifier(edge: Edge) {
        return edge.source.IRI + " " + edge.target.IRI + " " + edge.type.iri;
    }

    /**
     * Creates a new edge represented by a triplet source, target and type
     * @param source
     * @param target
     * @param type
     */
    createEdge(source: Node, target: Node, type: EdgeType): Edge {
        let edge = new Edge(source, target, type, this);
        Vue.set(this.edges, this.getEdgeIdentifier(edge), edge);
        return edge;
    }

    removeEdge() {

    }

    /**
     * Creates a new node in the graph based on its IRI
     * @param IRI
     */
    async fetchNode(IRI: string): Promise<Node> {
        // The node is always registered despite the correctness of IRI
        let node = this.createNode(IRI);

        try {
            await node.fetchViewSets();

            if (Object.keys(node.viewSets).length == 0) {
                throw new Error("Server responded, but no view sets returned. Probably wrong IRI specified.");
            }
        } catch(error) { // The node is removed and error is rethrowed
            this.removeNode(IRI);
            node = null;
            throw(error);
        }

        if (node) {
            node.viewSets[Object.keys(node.viewSets)[0]].defaultView.use();
        }
        return node;
    }
}
