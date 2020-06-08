import { Node } from "./Node";
import { ResponseElementType } from "../graph-fetcher/response-interfaces"
import { Graph } from "./Graph";
import ObjectSave from "../file-save/ObjectSave";
import clone from 'clone';
import GraphElementEdge from "../component/graph/GraphElementEdge";

/**
 * Information about the type of Edge. Same as ResponseElementType
 */
export interface EdgeType extends ResponseElementType {};

/**
 * Represents oriented edge in the graph
 */
export class Edge implements ObjectSave {
    /**
     * Each Node must belong to one and only one Graph. Every update is reported to the graph instance. Also provides fetcher.
     */
    graph: Graph;

    source: Node;
    target: Node;
    type: EdgeType;
    classes: string[] = [];

    element: GraphElementEdge = null;

    constructor (source: Node, target: Node, type: EdgeType, graph: Graph) {
        this.source = source;
        this.target = target;
        this.type = type;
        this.graph = graph;
    }

    /**
     * Decides whether one of the nodes is selected
     */
    public get neighbourSelected(): boolean {
        return this.source.selected || this.target.selected;
    }

    /**
     * Decides whether the edge is visible
     */
    public get isVisible(): boolean {
        return this.source.isVisible && this.target.isVisible;
    }

    saveToObject(): object {
        return {
            source: this.source.IRI,
            target: this.target.IRI,
            type: clone(this.type),
            classes: clone(this.classes),
        };
    }

    restoreFromObject(object: any): void {
        // We need to only restore classes because other items are node identifiers
        this.classes = object.classes ?? [];
    }
}