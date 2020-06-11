import NodeCommon from "./NodeCommon";
import GraphElementEdge from "../component/graph/GraphElementEdge";

export default abstract class EdgeCommon {
    source: NodeCommon;
    target: NodeCommon;

    element: GraphElementEdge;

    /**
     * Gets if the edge is currently in the visual graph. That means that both nodes are mounted or are not groups for
     * non group edge.
     */
    public abstract get isVisual(): boolean;
}
