import { Node } from "../graph/Node";
import { Edge } from "../graph/Edge";

/**
 * Interface for filter classes capable of filtering nodes and edges of graph
 */
export interface GraphFilter {
    getNodes(): Node[];
    getEdges(): Edge[];
}