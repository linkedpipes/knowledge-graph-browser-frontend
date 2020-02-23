import { Node } from "./Node";

import { ResponseElementType } from "../graph-fetcher/response-interfaces"
import { Graph } from "./Graph";

/**
 * Information about the type of Edge. Same as ResponseElementType
 */
export interface EdgeType extends ResponseElementType {};

/**
 * Represents oriented edge in the graph
 */
export class Edge {
    /**
     * Each Node must belong to one and only one Graph. Every update is reported to the graph instance. Also provides fetcher.
     */
    graph: Graph;

    // Todo: resolve how to identify edges
    constructor (graph: Graph) {
        this.graph = graph;
    }

    source: Node;
    target: Node;
    type: EdgeType;
}