/**
 * NodeGroup represents sub graph as single node in the graph.
 */
import {Node} from "./Node";
import NodeCommon from "./NodeCommon";
import ObjectSave from "../file-save/ObjectSave";
import GraphElementNodeGroup from "../component/graph/GraphElementNodeGroup.vue";
import GroupEdge from "./GroupEdge";
import NodeGroupVuex from "./component/NodeGroupVuex";

export default class NodeGroup extends NodeCommon implements ObjectSave {
    public vuexComponent: NodeGroupVuex;

    /**
     * Even if the node is mounted, this can be still null because the mounting is triggered by Vue every animation
     * frame.
     */
    element: GraphElementNodeGroup = null;

    /** @internal **/
    static IDCounter = 0;

    /**
     * @internal
     */
    id: string = `__node_group/${ NodeGroup.IDCounter++ }`;

    /**
     * @inheritDoc
     */
    public get identifier(): string {
        return this.id;
    }

    /**
     * @inheritDoc
     */
    public get selfOrGroup(): NodeGroup {
        return this;
    }

    /**
     * List of nodes in this group.
     *
     * Each node must be maximally in one group and the relation should be bidirectional
     */
    nodes: Node[] = [];

    /** Classes of nodes different from hierarchical class. Needed for clustering */
    private classesOfNodes: string[] = [];

    /**
     * Adds node to this group.
     * @param node
     * @param overrideExistingGroup Ignore existence in other group
     */
    public addNode(node: Node, overrideExistingGroup: boolean = false) {
        console.assert(!node.belongsToGroup || overrideExistingGroup, "Unable to add node", node, "into group", this, "because is already in", node.belongsToGroup);

        if (!node.belongsToGroup || overrideExistingGroup) {
            node.belongsToGroup = this;
            this.nodes.push(node);
        }

        node.classes.filter(cls => {
            if (cls !== node.hierarchicalClass) {
                if (!this.classesOfNodes.includes(cls)) {
                    this.classesOfNodes.push(cls);
                }
            }
        });
        
    }

    /**
     * Completely removes NodeGroup with all Nodes from the graph.
     * Safe to call anytime.
     */
    public remove() {
        this.nodes.forEach(node => node.remove());
        
        if (this.parent) {
            this.parent.children.splice(
                this.parent.children.indexOf(this), 1
            );
            
            // remove also pseudo-parent node if a node is a single child of pseudo-parent node 
            if (this.parent.identifier.startsWith("pseudo_parent") && this.parent.children?.length === 0) {
                this.parent.graph._removeNode(this.parent);
            }
        }

        this.selected = false;
        this.graph.removeGroupIgnoreNodes(this);
    }

    /**
     * If we manipulate with list of nodes, this group may be empty or contain only one node.
     * @internal
     */
    public checkForNodes() {
        if (this.nodes.length === 1) {
            this.nodes[0].belongsToGroup = null;
            this.nodes[0].onMountPosition = this.element?.element?.position() ? [this.element?.element?.position().x, this.element?.element?.position().y] : this.onMountPosition;
            this.nodes[0].mounted = true;
        }
        if (this.nodes.length <= 1) {
            this.graph.removeGroupIgnoreNodes(this);
        }
    }

    /**
     * Computes which classes should the grouped node have based on intersection of its child nodes.
     */
    public get nocache_classes(): string[] {
        let classes = new Set(this.nodes[0]?.classes ?? []);
        for (let node of this.nodes) {
            for (let cls of classes) {
                if (!node.classes.includes(cls)) {
                    classes.delete(cls);
                }
            }
        }
        return Array.from(classes);
    }

    public get classes(): string[] {
        return this.vuexComponent?.classes ?? this.nocache_classes;
    }

    public get nocache_nonhierarchical_classesOfNodes(): string[] {
        return this.classesOfNodes.filter(cls => cls !== this.hierarchicalClass);
    }

    /**
     * @non-reactive
     */
    private groupEdgesCache: {
        out: {[identifier: string]: GroupEdge},
        in: {[identifier: string]: GroupEdge},
        in_group: {[identifier: string]: GroupEdge},
    };

    /**
     * This function returns array of graph-unique GroupEdges which connects this NodeGroup, but does not point from
     * other NodeGroup (to avoid duplicity from other NodeGroup). We need to keep in mind that there could be multiple
     * edges of the same type between a group and a single node (or other node). Therefore the map is used to catalog
     *                             targetTypeGroupEdge
     *                             |    ||  ||       |
     * - the other node --------->  ---- |  ||       |
     *     - the edge type ------------>  -- |       |
     *         - final groupEdge --------->   -------
     */
    private getGroupEdgesInDirection(outNotIn: boolean, exclusivelyTargetIsGroup: boolean = false): GroupEdge[] {
        // Initialize cache
        if (!this.groupEdgesCache) {
            this.groupEdgesCache = {
                in_group: {},
                in: {},
                out: {},
            }
        }

        let targetTypeGroupEdge: Map<string, Map<string, {
            groupEdge: GroupEdge,
            classes: Set<string>,
        }>> = new Map();

        // *For every node in this group*
        for (let sourceNode of this.nodes) {
            if (!sourceNode.isVisible) continue;

            // *For every edge (and therefore neighbour) of the node*
            for (let edge of sourceNode.edges) {

                let targetNode: NodeCommon;
                if (outNotIn) {
                    targetNode = edge.target.selfOrGroup;

                    if (
                        targetNode instanceof NodeGroup && (
                            !edge.target.isVisible ||
                            targetNode == this
                        )
                    ) continue;
                } else {
                    targetNode = edge.source.selfOrGroup;

                    // XOR
                    if (((targetNode instanceof NodeGroup) && !exclusivelyTargetIsGroup) || ((targetNode instanceof Node) && exclusivelyTargetIsGroup)) continue;
                }

                if (
                    !edge.isVisible ||
                    !targetNode.isVisible
                ) continue;

                // target node

                if (!targetTypeGroupEdge.has(targetNode.identifier)) {
                    targetTypeGroupEdge.set(targetNode.identifier, new Map());
                }

                let typeGroupEdge = targetTypeGroupEdge.get(targetNode.identifier);

                // target node + edge

                if (!typeGroupEdge.has(edge.type.iri)) {
                    let newEdge: GroupEdge;
                    if (outNotIn) {
                        newEdge = new GroupEdge(this, targetNode, edge.type);
                    } else {
                        newEdge = new GroupEdge(targetNode, this, edge.type);
                    }

                    typeGroupEdge.set(edge.type.iri, {
                        groupEdge: newEdge,
                        classes: new Set(edge.classes),
                    });
                }

                // final groupEdge

                let groupEdgeClasses = typeGroupEdge.get(edge.type.iri).classes;
                for (let cls of groupEdgeClasses) {
                    if (!edge.classes.includes(cls)) {
                        groupEdgeClasses.delete(cls);
                    }
                }
            }
        }

        let edges : GroupEdge[] = [];

        for (let [_, typeGroupEdge] of targetTypeGroupEdge) {
            for (let [_, groupEdge] of typeGroupEdge) {
                groupEdge.groupEdge.classes = Array.from(groupEdge.classes);
                edges.push(groupEdge.groupEdge);
            }
        }

        // Use cache
        let cache = outNotIn ? this.groupEdgesCache.out : (exclusivelyTargetIsGroup ? this.groupEdgesCache.in_group : this.groupEdgesCache.in);
        let newCache = {} as {[identifier: string]: GroupEdge};
        for (let i in edges) { // Replace by cache
            if (cache.hasOwnProperty(edges[i].identifier)) edges[i] = cache[edges[i].identifier];
            newCache[edges[i].identifier] = edges[i];
        }
        if (outNotIn) {
            this.groupEdgesCache.out = newCache;
        } else {
            if (exclusivelyTargetIsGroup) {
                this.groupEdgesCache.in_group = newCache;
            } else {
                this.groupEdgesCache.in = newCache;
            }
        }

        return edges;
    }

    /**
     * Returns all visible `GroupEdge` associated with this `NodeGroup` **except** those having as a source other
     * `NodeGroup` to avoid duplicity. These edges are used to draw edges from and to grouped nodes in the graph.
     */
    get nocache_visibleGroupEdges(): GroupEdge[] {
        return [...this.getGroupEdgesInDirection(false), ...this.getGroupEdgesInDirection(true)];
    }

    get visibleGroupEdges(): GroupEdge[] {
        return this.vuexComponent?.visibleGroupEdges ?? this.nocache_visibleGroupEdges;
    }

    /**
     * @see visibleGroupEdges
     */
    get nocache_restOfVisibleGroupEdges(): GroupEdge[] {
        // Nodes pointing from other groups to this
        return this.getGroupEdgesInDirection(false, true);
    }

    get restOfVisibleGroupEdges(): GroupEdge[] {
        return this.vuexComponent?.restOfVisibleGroupEdges ?? this.nocache_restOfVisibleGroupEdges;
    }

    /**
     * Computes if the node should be visible in the graph.
     *
     * For group nodes it depends on user visibility of the grouped node and if at least one node in the group is visible.
     */
    public get nocache_isVisible(): boolean {
        if (!this.visible) return false;
        return this.nodes.some((node) => node.isVisible);
    }

    public get isVisible(): boolean {
        return this.vuexComponent?.isVisible ?? this.nocache_isVisible;
    }

    get nocache_neighbourSelected(): boolean {
        // Neighbour is selected or its group is selected
        for (let edge of [...this.visibleGroupEdges, ...this.restOfVisibleGroupEdges]) {
            if (edge.source === this && edge.target.selected) return true;
            if (edge.target === this && edge.source.selected) return true;
        }

        return false;
    }

    get neighbourSelected(): boolean {
        return this.vuexComponent?.neighbourSelected ?? this.nocache_neighbourSelected;
    }

    restoreFromObject(object: any): void {
        super.restoreFromObject(object);
        let nodes = [];
        for (let iri of object.nodes) {
            let node = this.graph.getNodeByIRI(iri);
            node.belongsToGroup = this;
            nodes.push(node);
        }
        this.nodes = nodes;
    }


    saveToObject(): object {
        return {
            ...super.saveToObject(),
            nodes: this.nodes.map(node => node.identifier),
        };
    }
}
