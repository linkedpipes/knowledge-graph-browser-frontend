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

    source: Node;
    target: Node;
    type: EdgeType;

    constructor (source: Node, target: Node, type: EdgeType, graph: Graph) {
        this.source = source;
        this.target = target;
        this.type = type;
        this.graph = graph;
    }
}