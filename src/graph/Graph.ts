import { Node, NodeType } from "./Node";
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

    /**
     * Internal method only for Node to remove itself from the graph
     * @internal
     * @param node Node to be removed
     */
    _removeNode(node: Node) {
        Vue.delete(this.nodes, node.IRI);
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
        source.edges.push(edge);
        target.edges.push(edge);
        Vue.set(this.edges, this.getEdgeIdentifier(edge), edge);
        return edge;
    }

    /**
     * Internal method only for Edge to properly unregister itself
     * @internal
     */
    _removeEdge(edge: Edge) {
        Vue.delete(edge.source.edges, edge.source.edges.indexOf(edge));
        Vue.delete(edge.target.edges, edge.target.edges.indexOf(edge));
    }

    /**
     * Returns all types of nodes currently presented in the graph.
     *
     * Every type is presented only once.
     */
    getAllTypes(): Set<NodeType> {
        let map = new Map<string, NodeType>();
        for (let node_iri in this.nodes) {
            let type = this.nodes[node_iri].currentView?.preview?.type;
            if (type) {
                map.set(type.iri, type);
            }
        }
        return new Set(map.values());
    }

    /**
     * Returns all classes of nodes currently presented int the graph.
     *
     * Every class is presented only once.
     */
    getAllClasses(): Set<string> {
        let classes = new Set<string>();
        for (let node_iri in this.nodes) {
            let nodeClasses = this.nodes[node_iri].currentView?.preview?.classes;
            if (nodeClasses) {
                for (let cls of nodeClasses) {
                    classes.add(cls);
                }
            }
        }

        return classes;
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
            this._removeNode(node);
            node = null;
            throw(error);
        }

        if (node) {
            await node.useDefaultView();
            await node.currentView.fetchPreview();
        }

        return node;
    }
}
