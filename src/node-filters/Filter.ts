import { Node } from "../graph/Node";
import { Edge } from "../graph/Edge";

/**
 * Interface for filter classes capable of filtering nodes and edges of graph
 */
abstract class GraphFilter {
    /**
     * Called when graph is updated
     */
    structureUpdated(): void {};

    abstract getNodes(): Node[];
    abstract getEdges(): Edge[];
}