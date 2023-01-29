import { Node } from "./Node";
import { ResponseElementType } from "../remote-server/ResponseInterfaces"
import { Graph } from "./Graph";
import ObjectSave from "../file-save/ObjectSave";
import clone from 'clone';
import GraphElementEdge from "../component/graph/GraphElementEdge";
import EdgeCommon from "./EdgeCommon";

/**
 * Information about the type of Edge. Same as ResponseElementType
 */
export interface EdgeType extends ResponseElementType {}

/**
 * Represents oriented edge in the graph
 */
export class Edge extends EdgeCommon implements ObjectSave {
    /**
     * Each Node must belong to one and only one Graph. Every update is reported to the graph instance. Also provides fetcher.
     */
    graph: Graph;

    source: Node;
    target: Node;

    constructor (source: Node, target: Node, type: EdgeType, graph: Graph) {
        super();
        this.source = source;
        this.target = target;
        this.type = type;
        this.graph = graph;
    }

    get identifier(): string {
        return `${this.source.identifier} ${this.type.iri} ${this.target.identifier}`;
    }

    /**
     * Gets if the edge is currently in the visual graph.
     */
    public get isVisual(): boolean {
        return this.source.mounted &&
            this.target.mounted &&
            !this.source.belongsToGroup &&
            !this.target.belongsToGroup;
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
