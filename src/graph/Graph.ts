import { Node, NodeType } from "./Node";
import { Edge, EdgeType } from "./Edge";
import { DataGraphFetcher } from "../graph-fetcher/DataGraphFetcher";
import Vue from 'vue';
import ObjectSave from "../file-save/ObjectSave";
import NodeGroup from "./NodeGroup";

/**
 * This class represents a graph. It is a container for nodes and edges and contains methods to remove or add them.
 * Usually there is only one graph instance at a time.
 */
export class Graph implements ObjectSave {
    /**
     * List of nodes.
     * Readonly for public, mutable for internal.
     *
     * You should not remove or insert directly to this object. Edges and other nodes may contain references to elements
     * in this list. This object is watched by Vue, therefore use Vue.set and Vue.delete to properly trigger changes.
     * Not everything is done automatically by Vue, for example to remove a node, you must remove also all the edges
     * manually.
     */
    nodes: {
        [IRI: string]: Node;
    } = {};

    /**
     * List of edges.
     * Readonly for public, mutable for internal.
     *
     * You should not remove or insert directly to this object. Edges and other nodes may contain references to elements
     * in this list. This object is watched by Vue, therefore use Vue.set and Vue.delete to properly trigger changes.
     * Not everything is done automatically by Vue, for example to remove a node, you must remove also all the edges
     * manually.
     */
    edges: {
        [Edge_identifier: string]: Edge;
    } = {};

    groups: NodeGroup[] = [];

    /**
     * From where the new nodes are fetched. It is not expected to be modified after the creation.
     */
    fetcher: DataGraphFetcher = null;

    /**
     * Returns existing node by its IRI
     * @param IRI
     */
    public getNodeByIRI(IRI: string): Node|null {
        return this.nodes[IRI];
    }

    createGroup(): NodeGroup {
        let group = new NodeGroup();
        this.groups.push(group);
        return group;
    }

    /**
     * Creates a new Node which is properly registered.
     * This node is "empty" and contains only its IRI. It is not mounted by default so it won't show in the graph area.
     * @param IRI
     */
    createNode(IRI: string): Node {
        let node = new Node(IRI, this);
        Vue.set(this.nodes, IRI, node); // this.nodes[IRI] = node;
        return node;
    }

    /**
     * Method for removing one single node from graph with all its edges and from all expansions.
     * Do not use it for removing multiple nodes at once because of performance issues.
     * @internal
     * @param node Node to be removed
     */
    _removeNode(node: Node) {
        Vue.delete(this.nodes, node.IRI);
        for (let edge of node.edges) {
            this._removeEdge(edge);
        }
    }

    /**
     * Generates identifier for edge.
     * @param edge
     */
    private static getEdgeIdentifier(edge: Edge) {
        return edge.source.IRI + " " + edge.target.IRI + " " + edge.type.iri;
    }

    /**
     * Creates a new edge represented by a triplet source, target and type.
     * @param source
     * @param target
     * @param type
     */
    createEdge(source: Node, target: Node, type: EdgeType): Edge {
        let edge = new Edge(source, target, type, this);
        Vue.set(this.edges, Graph.getEdgeIdentifier(edge), edge);
        return edge;
    }

    /**
     * Internal method only for Edge to properly unregister itself
     * @internal
     */
    _removeEdge(edge: Edge) {
        Vue.delete(this.edges, Graph.getEdgeIdentifier(edge));
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
     * Based on IRI it fetches the node from remote server, sets default view and returns it.
     *
     * The node has to be mounted to be shown in the graph area.
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

    //#region Object save methods

    saveToObject(): object {
        let nodes = [];
        let edges = [];

        for (let iri in this.nodes) nodes.push(this.nodes[iri].saveToObject());
        for (let eid in this.edges) edges.push(this.edges[eid].saveToObject());

        return {
            nodes,
            edges,
        }
    }

    restoreFromObject(object: any): void {
        for (let nodeData of object.nodes) {
            this.createNode(nodeData.IRI).restoreFromObject(nodeData);
        }
        for (let edgeData of object.edges) {
            this.createEdge(this.getNodeByIRI(edgeData.source), this.getNodeByIRI(edgeData.target), edgeData.type).restoreFromObject(edgeData);
        }
    }

    //#endregion Object save methods
}
