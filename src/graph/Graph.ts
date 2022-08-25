import { Node, NodeType } from "./Node";
import { Edge, EdgeType } from "./Edge";
import { RemoteServer } from "../remote-server/RemoteServer";
import Vue from 'vue';
import ObjectSave from "../file-save/ObjectSave";
import NodeGroup from "./NodeGroup";
import NodeCommon from "./NodeCommon";
import GroupEdge from "./GroupEdge";
import EdgeCommon from "./EdgeCommon";
import GraphVuex from "./component/GraphVuex.vue";
import Configuration from "../configurations/Configuration";

/**
 * This class represents a graph. It is a container for nodes and edges and contains methods to remove or add them.
 * Usually there is only one graph instance at a time.
 */
export class Graph implements ObjectSave {
    vuexComponent: GraphVuex;
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
     * Gets mounted Node[] which are not part of the group together with mounted NodeGroup[].
     * Useful for visual graph operations, because that are the nodes which are important.
     */
    public get nocache_nodesVisual(): NodeCommon[] {
        let nodes: NodeCommon[] = [];
        for (let iri in this.nodes) {
            let node = this.nodes[iri];
            if (node.mounted && !node.belongsToGroup) {
                nodes.push(node);
            }
        }

        return [...nodes, ...this.groups.filter(group => group.mounted)];
    }

    // similar to above function, but returns unmounted nodes and groups
    public get nocache_nodesUnmounted(): NodeCommon[] {
        let nodes: NodeCommon[] = [];
        for (let iri in this.nodes) {
            let node = this.nodes[iri];
            if (!node.mounted && !node.belongsToGroup) {
                nodes.push(node);
            }
        }

        return [...nodes, ...this.groups.filter(group => !group.mounted)];
    }

    // returns only mounted nodes
    public get mountedNodes(): Node[] {
        let nodes: Node[] = [];
        for (let iri in this.nodes) {
            let node = this.nodes[iri];
            if (node.mounted && !node.belongsToGroup) {
                nodes.push(node);
            }
        }

        return nodes;
    }
    
    public get nodesVisual(): NodeCommon[] {
        return this.vuexComponent?.nodesVisual ?? this.nocache_nodesVisual;
    }

    public get nocache_groupEdges(): GroupEdge[] {
        let edges: GroupEdge[] = [];
        for (let group of this.groups) {
            edges = [...edges, ...group.visibleGroupEdges];
        }
        return edges;
    }

    public get groupEdges(): GroupEdge[] {
        return this.vuexComponent?.groupEdges ?? this.nocache_groupEdges;
    }

    /**
     * Gets mounted Edge[] which does not point to a group and group edges.
     */
    public get nocache_edgesVisual(): EdgeCommon[] {
        return [...this.groupEdges, ...Object.values(this.edges)].filter(edge => edge.isVisual);
    }

    public get edgesVisual(): EdgeCommon[] {
        return this.vuexComponent?.edgesVisual ?? this.nocache_edgesVisual;
    }

    /**
     * From where the new nodes are fetched. It is not expected to be modified after the creation.
     */
    server: RemoteServer = null;

    /**
     * Current graph configuration. Can be changed.
     */
    configuration: Configuration = null

    /**
     * Returns existing node by its IRI
     * @param IRI
     */
    public getNodeByIRI(IRI: string): Node|null {
        return this.nodes[IRI];
    }

    createGroup(): NodeGroup {
        let group = new NodeGroup();
        group.graph = this;
        this.groups.push(group);
        return group;
    }

    /**
     * This function only removes group from list of groups. It does not care about unregistering nodes. Caller has to
     * do it manually.
     * @internal
     * @param group
     */
    removeGroupIgnoreNodes(group: NodeGroup) {
        this.groups = this.groups.filter(item => item !== group);
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
        // Remove edges for connected nodes
        for (const edge of node.connectedEdges) {
            const otherNode = edge.otherNode;

            otherNode.connectedEdges = otherNode.connectedEdges.filter(edge => edge.otherNode !== node);
        }

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

        //  Add edge to the source node
        source.connectedEdges.push({
            otherNode: edge.target,
            orientation: "outgoing",
            type: edge.type
        });

        //  Add edge to the target node
        target.connectedEdges.push({
            otherNode: edge.source,
            orientation: "incoming",
            type: edge.type
        });

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

    async getOrCreateNode(IRI: string): Promise<Node|false> {
        let node = this.nodes[IRI];
        if (!node) {
            try {
                node = await this.fetchNode(IRI);
            } catch (error) {
                console.warn("Error occurred while fetching a node. Probably the wrong IRI specified or there is a problem on server side.", error);
                return false;
            }
        } else {
            if (!node.viewSets) {
                node.useDefaultView().then((view) => view.fetchPreview());
            }
        }

        return node;
    }

    //#region Object save methods

    saveToObject(): object {
        let nodes = [];
        let edges = [];

        for (let iri in this.nodes) nodes.push(this.nodes[iri].saveToObject());
        for (let eid in this.edges) edges.push(this.edges[eid].saveToObject());
        let groups = this.groups.map(g => g.saveToObject());

        return {
            nodes,
            edges,
            groups,
        }
    }

    restoreFromObject(object: any): void {
        for (let nodeData of object.nodes) {
            this.createNode(nodeData.IRI).restoreFromObject(nodeData);
        }
        for (let edgeData of object.edges) {
            this.createEdge(this.getNodeByIRI(edgeData.source), this.getNodeByIRI(edgeData.target), edgeData.type).restoreFromObject(edgeData);
        }
        if (object.groups) {
            for (let group of object.groups) {
                this.createGroup().restoreFromObject(group);
            }
        } else {
            this.groups = [];
        }
    }

    //#endregion Object save methods
}
