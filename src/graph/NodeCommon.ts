import ObjectSave from "../file-save/ObjectSave";
import {Graph} from "./Graph";
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
     */
    mounted: boolean = false;

    element: GraphElementNodeMixin | GraphElementNode | GraphElementNodeGroup;

    /**
     * Unique identifier for both Node and NodeGroup.
     */
    abstract get identifier(): string;

    onMountPosition: [number, number] | null = null;

    /**
     * Whether the node is selected on the board
     */
    selected: boolean = false;

    visible: boolean = true;
    public abstract get isVisible(): boolean;

    /**
     * Whether the node can not be moved by layouts.
     */
    lockedForLayouts: boolean = false;

    abstract get neighbourSelected(): boolean;

    abstract restoreFromObject(object: any): void;
    abstract saveToObject(): object;
}
