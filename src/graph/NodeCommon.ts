import ObjectSave from "../file-save/ObjectSave";
import {Graph} from "./Graph";
import { Node } from "./Node";
import GraphElementNodeMixin from "../component/graph/GraphElementNodeMixin";
import GraphElementNode from "../component/graph/GraphElementNode.vue";
import GraphElementNodeGroup from "../component/graph/GraphElementNodeGroup.vue";

export default abstract class NodeCommon implements ObjectSave {
    /**
     * Each Node must belong to one and only one Graph. Every update is reported to the graph instance. Also provides fetcher.
     */
    graph: Graph;

    /**
     * Whether the node should be mounted in the Cytoscape graph.
     *
     * This is useful for situations, when many nodes has been downloaded for different reasons than to visualize
     * them in the graph.
     *
     * Each newly created node is not mounted by default.
     * Edge having not-mounted node is also not mounted.
     * Node in the group should be mounted.
     */
    mounted: boolean = false;

    /**
     * You can specify the initial position of node.
     * VISUAL GRAPH FEATURE
     */
    onMountPosition: [number, number] | null = null;

    /**
     * Vue component responsible for registering the node in the Cytoscape instance.
     * GraphElementNodeMixin is a common ancestor for both GraphElementNode and GraphElementNodeGroup.
     */
    element: GraphElementNodeMixin | GraphElementNode | GraphElementNodeGroup;

    /**
     * All incoming and outgoing edges.
     * Used for traversing the graph.
     */
    connectedEdges: any[] = [];

    /**
     * Node's parent
     */
    parent: Node = null;

    /**
     * Node's children
     */
    children: NodeCommon[] = [];

    /** Indicates which hierarchical group the node belongs to. */
    hierarchicalClass: string;

    /** Indicates at what hierarchical level the node is located. */
    hierarchicalLevel: number = 0;

    /** Indicates whether a node is mounted in hierarchy. In case it is not mounted in a graph area. */
    isMountedInHierarchy: boolean = false;

    /**
     * Safely removes the element from the graph.
     * This method should properly unregister everything about the node.
     */
    public abstract remove(): void;

    /**
     * Unique identifier for both Node and NodeGroup.
     * The same identifier has Cytoscape element which can be obtained as `this.element.element.id()`
     */
    abstract get identifier(): string;

    /**
     * Returns the node or the group it belongs to.
     * Can be used to obtain NodeCommon which is drawn in the graph.
     */
    abstract get selfOrGroup(): NodeCommon;

    abstract get classes(): string[];

    /**
     * Whether the node is selected on the board.
     */
    selected: boolean = false;

    /**
     * Computes whether neighbour node is selected.
     */
    abstract get neighbourSelected(): boolean;

    /**
     * User visibility of the node
     */
    visible: boolean = true;

    /**
     * Combines user visibility and filter visibility.
     * It can be true even if the node is part of a group.
     */
    public abstract get isVisible(): boolean;

    /**
     * Whether the node can not be moved by layouts.
     * Only some layouts support this.
     * VISUAL GRAPH FEATURE
     */
    lockedForLayouts: boolean = false;

    saveToObject(): object {
        return {
            mounted: this.mounted,
            selected: this.selected,
            visible: this.visible,
            lockedForLayouts: this.lockedForLayouts,
            onMountPosition: this?.element?.getSavePosition() ?? null,
        }
    }

    restoreFromObject(object: any): void {
        this.mounted = object.mounted ?? true;
        this.selected = object.selected ?? false;
        this.visible = object.visible ?? true;
        this.lockedForLayouts = object.lockedForLayouts ?? false;
        this.onMountPosition = object.onMountPosition ?? [0, 0];
    }

    /**
     * Selects this and only this node.
     *
     * Side panels behave according to how many nodes are selected, therefore by selecting specific node exclusively
     * detail panel will be opened.
     */
    selectExclusively() {
        for (let IRI in this.graph.nodes) {
            this.graph.nodes[IRI].selected = false;
        }
        this.graph.groups.forEach(g => g.selected = false);
        this.selected = true;
    }
}
