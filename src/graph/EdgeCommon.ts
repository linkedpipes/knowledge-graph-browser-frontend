import NodeCommon from "./NodeCommon";
import GraphElementEdge from "../component/graph/GraphElementEdge";
import {EdgeType} from "./Edge";

export default abstract class EdgeCommon {
    source: NodeCommon;
    target: NodeCommon;
    type: EdgeType;
    element: GraphElementEdge = null;
    classes: string[] = [];
    
    /** 
     * Indicates whether an edge is moved from a child node to a parent node (when a child gets hidden). \
     * For more information, see https://github.com/Razyapoo/KGBClusteringDocumentation/blob/main/technical_documentation.md#extension-of-the-graphareamanipulatorts
    */ 
    isEdgeFromChild: boolean = false;

    /**
     * Gets if the edge is currently in the visual graph. That means that both nodes are mounted or are not groups for
     * non group edge.
     */
    public abstract get isVisual(): boolean;
}
